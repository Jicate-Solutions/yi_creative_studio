import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportService } from "@/lib/services/export-service";
import type { ExportRequest, ExportFormat, ColorMode, ExportResolution } from "@/types/export";
import { validateExportParams, isCMYKMode, formatSupportsCMYK } from "@/types/export";

/**
 * POST /api/export - Export a creative with color mode conversion
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body: ExportRequest = await request.json();
    const { creativeId, format, colorMode, resolution, quality } = body;

    // Validate required fields
    if (!creativeId || !format || !colorMode || !resolution) {
      return NextResponse.json(
        { error: "Missing required fields: creativeId, format, colorMode, resolution" },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats: ExportFormat[] = ["png", "jpg", "pdf", "tiff"];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate color mode
    const validColorModes: ColorMode[] = ["rgb", "cmyk-fogra39", "cmyk-swop", "cmyk-japan"];
    if (!validColorModes.includes(colorMode)) {
      return NextResponse.json(
        { error: `Invalid colorMode. Must be one of: ${validColorModes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate resolution
    const validResolutions: ExportResolution[] = [72, 150, 300, 600];
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        { error: `Invalid resolution. Must be one of: ${validResolutions.join(", ")}` },
        { status: 400 }
      );
    }

    // Check CMYK/format compatibility
    if (isCMYKMode(colorMode) && !formatSupportsCMYK(format)) {
      return NextResponse.json(
        { error: `${format.toUpperCase()} format does not support CMYK. Use JPG, TIFF, or PDF.` },
        { status: 400 }
      );
    }

    // Validate export params
    const validationError = validateExportParams({
      creativeId,
      format,
      colorMode,
      resolution,
      quality,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Fetch the creative
    const { data: creative, error: creativeError } = await supabase
      .from("creatives")
      .select("*, organization_id")
      .eq("id", creativeId)
      .single();

    if (creativeError) {
      if (creativeError.code === "PGRST116") {
        return NextResponse.json({ error: "Creative not found" }, { status: 404 });
      }
      console.error("Failed to fetch creative:", creativeError);
      return NextResponse.json(
        { error: "Failed to fetch creative" },
        { status: 500 }
      );
    }

    // Verify user is member of the creative's organization
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", creative.organization_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Not authorized to export this creative" },
        { status: 403 }
      );
    }

    // Get the image URL
    const imageUrl = creative.image_url;
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Creative has no image to export" },
        { status: 400 }
      );
    }

    // Get creative name from form_data or title
    const formData = creative.form_data as Record<string, unknown> | null;
    const creativeName = creative.title ||
                         (formData?.title as string) ||
                         (formData?.eventName as string) ||
                         "Creative";

    // Perform the export
    const { buffer, filename, mimeType } = await exportService.exportCreative(
      imageUrl,
      creativeName,
      {
        creativeId,
        format,
        colorMode,
        resolution,
        quality: quality || (format === "jpg" ? 90 : undefined),
      }
    );

    // Return the file as a downloadable response
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
        "X-Color-Mode": colorMode,
        "X-Resolution": resolution.toString(),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/export/profiles - Check available ICC profiles
 */
export async function GET() {
  try {
    const profiles = await exportService.checkICCProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Profile check error:", error);
    return NextResponse.json(
      { error: "Failed to check ICC profiles" },
      { status: 500 }
    );
  }
}
