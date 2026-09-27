import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const handle = async (req: Request) => (await getAuth()).handler(req);

export { handle as GET, handle as POST, handle as OPTIONS };
