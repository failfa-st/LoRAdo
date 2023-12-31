// Configuration for the face-api model path
import path from "node:path";

import * as tf from "@tensorflow/tfjs-node";
import type { TResolvedNetInput } from "@vladmandic/face-api";
import * as faceApi from "@vladmandic/face-api";
import sharp from "sharp";

export const MODEL_URL = path.join(process.cwd(), "public/face-api/models");

/**
 * Load models required by face-api.
 * It sets up TensorFlow backend, and loads the SSD MobileNet V1 model.
 */
export async function loadModels() {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	await faceApi.tf.setBackend("tensorflow");
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	await faceApi.tf.enableProdMode();
	await faceApi.tf.ENV.set("DEBUG", false);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	await faceApi.tf.ready();

	await faceApi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
}

/**
 * Crops the image around the detected face based on a given zoom level.
 * @param {string} inputImagePath - Path to the input image.
 * @param {Object} outputDimensions - Desired output dimensions.
 * @param {number} zoomLevel - Zoom level, between 0 (minimal zoom) and 1 (maximum zoom).
 * @returns {Promise<Buffer>} - A buffer containing the cropped image.
 */
export async function cropImageToFace(
	inputImagePath: string,
	outputDimensions: { height: number; width: number },
	zoomLevel = 0
) {
	const { data, info } = await sharp(inputImagePath).raw().toBuffer({ resolveWithObject: true });

	const imageTensor = tf.tensor3d(data, [
		info.height,
		info.width,
		info.channels,
	]) as unknown as TResolvedNetInput;
	let width;
	let height;
	let left;
	let top;

	let minimalWidth;
	let minimalHeight; // For zoomLevel: 0
	let maximalWidth;
	let maximalHeight; // For zoomLevel: 1

	const detections = await faceApi.detectAllFaces(imageTensor);
	// Calculations for zoomLevel: 0
	const aspectRatioOriginal = info.width / info.height;
	const aspectRatioDesired = outputDimensions.width / outputDimensions.height;
	if (detections.length === 0) {
		// Set the center to the center of the image
		const centerX = info.width / 2;
		const centerY = info.height / 2;

		if (aspectRatioOriginal > aspectRatioDesired) {
			// Original image is wider, crop sides
			minimalHeight = info.height;
			minimalWidth = minimalHeight * aspectRatioDesired;
		} else {
			// Original image is taller, crop top and bottom
			minimalWidth = info.width;
			minimalHeight = minimalWidth / aspectRatioDesired;
		}

		width = minimalWidth;
		height = minimalHeight;

		// Center the cropping box around the center of the image
		left = centerX - width / 2;
		top = centerY - height / 2;
	} else {
		const faceBox = detections[0].box;

		const faceCenterX = faceBox.x + faceBox.width / 2;
		const faceCenterY = faceBox.y + faceBox.height / 2;

		if (aspectRatioOriginal > aspectRatioDesired) {
			// Original image is wider, crop sides
			minimalHeight = info.height;
			minimalWidth = minimalHeight * aspectRatioDesired;
		} else {
			// Original image is taller, crop top and bottom
			minimalWidth = info.width;
			minimalHeight = minimalWidth / aspectRatioDesired;
		}

		// Calculations for zoomLevel: 1
		if (aspectRatioOriginal > aspectRatioDesired) {
			// If the image is wider (landscape)
			maximalHeight = faceBox.height;
			maximalWidth = maximalHeight * aspectRatioDesired;
		} else {
			// If the image is taller (portrait)
			maximalWidth = faceBox.width;
			maximalHeight = maximalWidth / aspectRatioDesired;
		}

		// Linearly interpolate width and height based on zoomLevel
		width = minimalWidth + zoomLevel * (maximalWidth - minimalWidth);
		height = minimalHeight + zoomLevel * (maximalHeight - minimalHeight);

		// Center the cropping box around the face
		left = faceCenterX - width / 2;
		top = faceCenterY - height / 2;
	}

	// Ensure cropping coordinates are within the image bounds
	left = Math.max(0, Math.min(info.width - width, left));
	top = Math.max(0, Math.min(info.height - height, top));

	return sharp(inputImagePath)
		.extract({
			left: Math.round(left),
			top: Math.round(top),
			width: Math.round(width),
			height: Math.round(height),
		})
		.resize(outputDimensions.width, outputDimensions.height)
		.png()
		.toBuffer();
}
