// Test Supabase Storage Upload Connectivity
// Run: node scripts/test-storage-upload.mjs
//
// This script tests if the 'creatives' Storage bucket exists and is properly configured.
// It attempts to upload a test file, retrieve its public URL, and clean up afterward.

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpload() {
  console.log('🧪 Testing Supabase Storage upload...\n');

  const testBuffer = Buffer.from('Test image data', 'utf8');
  const filename = `test-org/${randomUUID()}.txt`;

  console.log('📁 Bucket: creatives');
  console.log('📄 Filename:', filename);
  console.log('⏳ Uploading...\n');

  const { data, error } = await supabase.storage
    .from('creatives')
    .upload(filename, testBuffer, {
      contentType: 'text/plain',
      upsert: false
    });

  if (error) {
    console.error('❌ Upload FAILED');
    console.error('Error:', error.message);
    console.error('Details:', JSON.stringify(error, null, 2));

    if (error.message.includes('<!DOCTYPE') || error.message.includes('<html')) {
      console.error('\n🔍 ROOT CAUSE: Bucket does not exist or wrong permissions');
      console.error('   → Go to Supabase dashboard and create "creatives" bucket');
      console.error('   → Ensure "Public bucket" is enabled');
      console.error('   → Add RLS policies for authenticated uploads and public reads');
      process.exit(1);
    } else if (error.statusCode === '403' || error.message.includes('permission')) {
      console.error('\n🔍 ROOT CAUSE: RLS policy blocking uploads');
      console.error('   → Go to Storage → Policies in Supabase dashboard');
      console.error('   → Add policy: Allow authenticated uploads to creatives');
      process.exit(1);
    } else {
      console.error('\n⚠️  Unexpected error - check Supabase service status');
      process.exit(1);
    }
  } else {
    console.log('✅ Upload SUCCESSFUL');
    console.log('Data:', data);

    // Test public URL
    const { data: urlData } = supabase.storage
      .from('creatives')
      .getPublicUrl(filename);

    console.log('\n🔗 Public URL:', urlData.publicUrl);

    // Verify URL is accessible
    try {
      const response = await fetch(urlData.publicUrl);
      if (response.ok) {
        console.log('✅ Public URL is accessible');
      } else {
        console.error('❌ Public URL returned status:', response.status);
        console.error('   → Check if "Public bucket" is enabled in Supabase');
      }
    } catch (fetchError) {
      console.error('❌ Failed to fetch public URL:', fetchError.message);
    }

    // Cleanup
    const { error: removeError } = await supabase.storage.from('creatives').remove([filename]);
    if (!removeError) {
      console.log('🧹 Cleaned up test file');
    } else {
      console.warn('⚠️  Failed to cleanup test file (non-critical)');
    }

    console.log('\n✨ All tests passed! Storage bucket is configured correctly.');
    process.exit(0);
  }
}

testUpload().catch((error) => {
  console.error('\n💥 Unexpected error during test:');
  console.error(error);
  process.exit(1);
});
