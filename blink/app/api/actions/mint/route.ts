import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";

export const GET = async (req: Request) => {
  const payload: ActionGetResponse = {
    icon: "rug_combine.gif",
    label: "Mint",
    description: "Mint a rare rug, for free, if you guess an unminted rug",
    title: "Rit Rafa's Rare Rug Emporium",
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};
