import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([], { status: 500 });

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/proveedores?order=nombre.asc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    if (!res.ok) return NextResponse.json([], { status: 500 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch { return NextResponse.json([], { status: 500 }); }
}

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Missing config" }, { status: 500 });

  try {
    const body = await req.json();
    const { newFiles, ...providerData } = body;

    // 1. Upload new files to Drive if present
    if (newFiles && Array.isArray(newFiles) && newFiles.length > 0) {
      try {
        // Fetch building name for folder structure
        const buildingRes = await fetch(`${supabaseUrl}/rest/v1/edificios?id=eq.${providerData.edificio_id}`, {
          headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
        });
        const buildings = await buildingRes.json();
        const buildingName = buildings[0]?.nombre || "Desconocido";

        const { getBuildingFolders, uploadFileToDrive, getOrCreateFolder } = await import("@/lib/googleDrive");
        const { contractsRoot } = await getBuildingFolders(buildingName);
        const providerFolderId = await getOrCreateFolder(`Proveedor ${providerData.nombre}`, contractsRoot);

        const uploadedDocs = [];
        for (const file of newFiles) {
          const buffer = Buffer.from(file.content, "base64");
          const resDrive = await uploadFileToDrive(buffer, file.name, "application/octet-stream", providerFolderId);
          uploadedDocs.push({
            name: file.name,
            url: resDrive.webViewLink,
            id: resDrive.id
          });
        }
        providerData.documentos_adicionales = [
          ...(providerData.documentos_adicionales || []),
          ...uploadedDocs
        ];
      } catch (driveErr) {
        console.error("Error uploading provider files to Drive:", driveErr);
      }
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/proveedores`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(providerData),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
