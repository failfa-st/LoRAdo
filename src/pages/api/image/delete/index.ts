import fs from "node:fs/promises";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function uploadImageHandler(
	request: NextApiRequest,
	response: NextApiResponse<unknown>
) {
	switch (request.method) {
		case "POST":
			try {
				await fs.rm(request.body.outputPath);
				await fs.rm(request.body.captionPath);
				response.status(202).json({ message: "accepted" });
			} catch (error) {
				console.log(error);
				// TODO handle error correctly
				response.status(500).json({ message: "Server error" });
			}

			break;
		default:
			response.status(405).json({ message: "Method not allowed" });
			break;
	}
}
