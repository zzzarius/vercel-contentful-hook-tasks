import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { body } = req;
  if (!body) {
    return res.status(400).send("No body provided");
  }
  return res.send(JSON.stringify(body));
}