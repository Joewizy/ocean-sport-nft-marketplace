// utils/uploadToPinata.ts
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY!;
const PINATA_SECRET_API_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY!;

// Helper to upload files (e.g. image)
async function uploadFileToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, `${file.name}`);

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${PINATA_API_KEY}:${PINATA_SECRET_API_KEY}`)}`,
    },
    body: formData as any,
  });

  if (!res.ok) {
    throw new Error(`File upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
}

// Helper to upload JSON metadata
async function uploadJSONToPinata(jsonData: object): Promise<string> {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${PINATA_API_KEY}:${PINATA_SECRET_API_KEY}`)}`,
    },
    body: JSON.stringify(jsonData),
  });

  if (!res.ok) {
    throw new Error(`Metadata upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
}


export async function uploadToIPFS(name: string, description: string, file: File): Promise<string> {
  const imageUrl = await uploadFileToPinata(file);
  const metadata = {
    name,
    description,
    image: imageUrl, // file CID URL
  };

  const tokenURI = await uploadJSONToPinata(metadata);

  console.log('Final tokenURI:', tokenURI);
  return tokenURI;
}
