import { Box } from "@mui/joy";
import dynamic from "next/dynamic";

import img from "../../public/images/anamnesis33/example (1).jpg";

const FaceDetectionImage = dynamic(() => import("@/components/FaceDetectionImage"), {
	ssr: false,
});
export default function Page() {
	return (
		<Box>
			<FaceDetectionImage {...img} alt="image" style={{ width: 200, height: "auto" }} />
		</Box>
	);
}
