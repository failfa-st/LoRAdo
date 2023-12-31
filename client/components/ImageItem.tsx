import CheckIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SaveIcon from "@mui/icons-material/Save";
import {
	IconButton,
	Typography,
	Card,
	CardContent,
	Box,
	Textarea,
	FormControl,
	FormLabel,
	FormHelperText,
	CircularProgress,
	useTheme,
} from "@mui/joy";
import dynamic from "next/dynamic";
import type { ChangeEventHandler } from "react";
import { useState } from "react";

import type { FaceBox, ImageData } from "@/types";

const FaceDetectionImage = dynamic(() => import("@/components/FaceDetectionImage"), {
	ssr: false,
});
export interface ImageItemProps {
	upload?: boolean;
	modified?: boolean;
	demo?: boolean;
	image: ImageData;
	onRemove?: () => void;
	onSave?: () => void;
	onOpen?: () => void;
	onFace?: (faceBox: FaceBox) => void;
	onCaptionChange?: ChangeEventHandler<HTMLTextAreaElement>;
}

export function StateIcon({ loading, done }: { loading?: boolean; done?: boolean }) {
	const theme = useTheme();
	if (loading) {
		return <CircularProgress size="sm" />;
	}

	return done ? (
		<CheckIcon sx={{ color: theme.palette.success[500] }} />
	) : (
		<FileUploadIcon sx={{ color: theme.palette.warning[500] }} />
	);
}

export default function ImageItem({
	image,
	demo,
	modified,
	onRemove,
	onSave,
	onOpen,
	onFace,
	onCaptionChange,
}: ImageItemProps) {
	const [faceDetection, setFaceDetection] = useState(Boolean(image.faceBox));

	const hasGoodSize = Math.min(image.width, image.height) >= 1536;

	return (
		<Card
			variant="soft"
			color={hasGoodSize && image.faceBox ? "neutral" : "danger"}
			sx={{
				breakInside: "avoid",
				opacity: demo ? 0.25 : undefined,
				pointerEvents: demo ? "none" : undefined,
				userSelect: demo ? "none" : undefined,
			}}
		>
			<div>
				{
					<Typography
						level="title-md"
						startDecorator={
							<StateIcon loading={!faceDetection} done={image.uploaded || demo} />
						}
						sx={{ mr: 6 }}
					>
						{image.name}
					</Typography>
				}

				{onRemove && !modified && (
					<IconButton
						aria-label="Remove"
						size="sm"
						variant="solid"
						color="danger"
						sx={{ position: "absolute", top: "0.875rem", right: "0.5rem" }}
						onClick={onRemove}
					>
						<DeleteIcon />
					</IconButton>
				)}
				{onSave && modified && (
					<IconButton
						aria-label="Save"
						size="sm"
						variant="solid"
						color="warning"
						sx={{ position: "absolute", top: "0.875rem", right: "0.5rem" }}
						onClick={onSave}
					>
						<SaveIcon />
					</IconButton>
				)}
			</div>
			<CardContent>
				<div>
					<Typography level="body-xs">
						Dimensions: {image.width}x{image.height}
					</Typography>
				</div>
			</CardContent>
			<Box
				component={demo ? "div" : "button"}
				type={demo ? undefined : "button"}
				sx={{
					mx: -2,
					p: 0,
					bgcolor: "none",
					border: 0,
					display: "flex",
					cursor: demo ? "default" : "pointer",
				}}
				onClick={onOpen}
			>
				<FaceDetectionImage
					noDetection={Boolean(image.faceBox)}
					faceBox={image.faceBox}
					src={image.src}
					alt={image.name}
					width={image.width}
					height={image.height}
					style={{
						width: "100%",
						height: "auto",
					}}
					onFace={faceBox => {
						setFaceDetection(true);
						if (onFace) {
							onFace(faceBox);
						}
					}}
				/>
			</Box>
			<FormControl>
				<FormLabel>Caption</FormLabel>
				<Textarea readOnly={demo} value={image.caption} onChange={onCaptionChange} />
				<FormHelperText>Describe the subject in the image</FormHelperText>
			</FormControl>
		</Card>
	);
}
