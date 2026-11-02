import cv2
import numpy as np
import os
import uuid
from pathlib import Path
from typing import List, Dict, Any
from ..config import UPLOADS_DIR

class ReconstructionEngine:
    """
    ROADGUARD VISION Reconstruction Simulator:
    Generates high-fidelity visual representations of proposed road rehabilitations.
    Synthesizes smooth mastic bituminous patches, micro-surfacing layers,
    and IRC-35 thermoplastic lane markings onto damaged road segments.
    Strictly watermarks all output with the mandatory statutory disclaimer:
    'AI-GENERATED PROPOSED RECONSTRUCTION – NOT AN ACTUAL COMPLETED ROAD.'
    """

    MANDATORY_DISCLAIMER = "AI-GENERATED PROPOSED RECONSTRUCTION - NOT AN ACTUAL COMPLETED ROAD."

    @classmethod
    def simulate_reconstruction(
        cls,
        image_path: str,
        detections: List[Dict[str, Any]],
        selected_actions: List[str]
    ) -> Dict[str, Any]:
        """
        Executes visual simulation of selected engineering repairs on the road image.
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Source image not found: {image_path}")

        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Unable to read image at {image_path}")

        h, w = img.shape[:2]
        reconstructed = img.copy()

        # Action 1: Road resurfacing (Micro-surfacing / Asphalt Overlay)
        if "Road resurfacing" in selected_actions:
            # Mask the road carriageway (lower 60% of frame typically)
            road_mask = np.zeros((h, w), dtype=np.uint8)
            poly_pts = np.array([
                [int(w * 0.05), h],
                [int(w * 0.25), int(h * 0.38)],
                [int(w * 0.75), int(h * 0.38)],
                [int(w * 0.95), h]
            ], np.int32)
            cv2.fillPoly(road_mask, [poly_pts], 255)

            # Generate synthetic uniform high-grade asphalt texture
            asphalt_patch = np.zeros_like(img)
            # Deep rich dark charcoal asphalt color (BGR: 48, 50, 52)
            noise = np.random.normal(0, 4, (h, w, 3)).astype(np.int16)
            base_asphalt = np.clip(np.array([50, 52, 54], dtype=np.int16) + noise, 0, 255).astype(np.uint8)

            # Blend with original perspective
            blend_alpha = 0.82
            cv2.seamlessClone
            reconstructed[road_mask == 255] = cv2.addWeighted(
                reconstructed[road_mask == 255], 1.0 - blend_alpha,
                base_asphalt[road_mask == 255], blend_alpha, 0
            )

        # Action 2: Pothole patching
        if "Pothole patching" in selected_actions and "Road resurfacing" not in selected_actions:
            for det in detections:
                if det.get("defect_type") == "Potholes":
                    bbox = det["bbox"]
                    bx = int(bbox[0] * w)
                    by = int(bbox[1] * h)
                    bw = int(bbox[2] * w)
                    bh = int(bbox[3] * h)

                    # Smooth patch with feathered gaussian edge
                    patch_roi = reconstructed[by:by+bh, bx:bx+bw]
                    if patch_roi.size > 0:
                        # Bituminous mastic tone
                        mastic_color = np.array([45, 46, 48], dtype=np.uint8)
                        patch_synthetic = np.full_like(patch_roi, mastic_color)
                        # Add micro-aggregate texture
                        noise = np.random.normal(0, 3, patch_roi.shape).astype(np.int16)
                        patch_synthetic = np.clip(patch_synthetic.astype(np.int16) + noise, 0, 255).astype(np.uint8)
                        
                        # Soft ellipse mask for natural asphalt patch look
                        patch_mask = np.zeros((bh, bw), dtype=np.uint8)
                        cv2.ellipse(patch_mask, (bw // 2, bh // 2), (int(bw * 0.48), int(bh * 0.48)), 0, 0, 360, 255, -1)
                        patch_mask = cv2.GaussianBlur(patch_mask, (15, 15), 5)
                        mask_3ch = cv2.merge([patch_mask, patch_mask, patch_mask]) / 255.0

                        reconstructed[by:by+bh, bx:bx+bw] = (
                            reconstructed[by:by+bh, bx:bx+bw] * (1.0 - mask_3ch) +
                            patch_synthetic * mask_3ch
                        ).astype(np.uint8)

        # Action 3: Crack sealing
        if "Crack sealing" in selected_actions and "Road resurfacing" not in selected_actions:
            for det in detections:
                if det.get("defect_type") == "Road cracks":
                    bbox = det["bbox"]
                    bx = int(bbox[0] * w)
                    by = int(bbox[1] * h)
                    bw = int(bbox[2] * w)
                    bh = int(bbox[3] * h)
                    # Apply polymer sealant band
                    cv2.rectangle(
                        reconstructed,
                        (bx, by), (bx + bw, by + bh),
                        (35, 35, 38), -1
                    )
                    # Gaussian blur to simulate hot-pour rubberized bitumen band
                    roi = reconstructed[max(0, by-2):min(h, by+bh+2), max(0, bx-2):min(w, bx+bw+2)]
                    if roi.size > 0:
                        reconstructed[max(0, by-2):min(h, by+bh+2), max(0, bx-2):min(w, bx+bw+2)] = cv2.GaussianBlur(roi, (7, 7), 2)

        # Action 4: Road marking restoration
        if "Road marking restoration" in selected_actions or "Road resurfacing" in selected_actions:
            # Draw standard IRC-35 thermoplastic lane dividers
            lane_color_white = (245, 245, 245)
            lane_color_yellow = (40, 215, 255)

            # Centerline dashed markings
            center_x = int(w * 0.5)
            start_y = int(h * 0.45)
            dash_count = 6
            dash_len = int((h - start_y) / (dash_count * 2))

            for i in range(dash_count):
                curr_y = start_y + i * (dash_len * 2)
                curr_y_end = curr_y + dash_len
                # Perspective broadening towards bottom
                progress = (curr_y - start_y) / float(h - start_y)
                thickness = max(2, int(3 + progress * 7))
                cv2.line(reconstructed, (center_x, curr_y), (center_x, curr_y_end), lane_color_yellow, thickness, cv2.LINE_AA)

            # Left and Right solid edge lines with perspective
            left_p1 = (int(w * 0.22), int(h * 0.45))
            left_p2 = (int(w * 0.08), h)
            cv2.line(reconstructed, left_p1, left_p2, lane_color_white, 4, cv2.LINE_AA)

            right_p1 = (int(w * 0.78), int(h * 0.45))
            right_p2 = (int(w * 0.92), h)
            cv2.line(reconstructed, right_p1, right_p2, lane_color_white, 4, cv2.LINE_AA)

        # Action 5: Streetlight installation or maintenance (Luminance & Safety Visibility)
        if "Streetlight installation or maintenance" in selected_actions:
            # Warm LED road lighting glow simulation
            glow_overlay = np.zeros_like(reconstructed)
            # Create lighting cones from top sides
            cv2.circle(glow_overlay, (int(w * 0.15), int(h * 0.2)), int(w * 0.35), (200, 230, 255), -1)
            cv2.circle(glow_overlay, (int(w * 0.85), int(h * 0.2)), int(w * 0.35), (200, 230, 255), -1)
            glow_blurred = cv2.GaussianBlur(glow_overlay, (101, 101), 0)
            reconstructed = cv2.addWeighted(reconstructed, 0.88, glow_blurred, 0.18, 0)

        # MANDATORY STATUTORY WATERMARK & DISCLAIMER
        # Top engineering bar
        cv2.rectangle(reconstructed, (0, 0), (w, 36), (11, 19, 43), -1)
        cv2.putText(
            reconstructed,
            "ROADGUARD VISION // PROPOSED RECONSTRUCTION SIMULATION",
            (14, 23),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.48,
            (0, 210, 255),
            1,
            cv2.LINE_AA
        )

        # Bottom Mandatory Statutory Disclaimer Bar (High Visibility Red/Dark Navy)
        disclaimer_h = 42
        cv2.rectangle(reconstructed, (0, h - disclaimer_h), (w, h), (15, 20, 30), -1)
        cv2.rectangle(reconstructed, (0, h - disclaimer_h), (w, h - disclaimer_h + 2), (220, 38, 38), -1)

        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.44
        thick = 1
        (dtw, dth), _ = cv2.getTextSize(cls.MANDATORY_DISCLAIMER, font, font_scale, thick)
        disc_x = max(10, (w - dtw) // 2)
        cv2.putText(
            reconstructed,
            cls.MANDATORY_DISCLAIMER,
            (disc_x, h - 14),
            font,
            font_scale,
            (255, 255, 255),
            thick,
            cv2.LINE_AA
        )

        # Save reconstructed image
        recon_filename = f"recon_{uuid.uuid4().hex[:8]}_{Path(image_path).name}"
        recon_path = str(UPLOADS_DIR / recon_filename)
        cv2.imwrite(recon_path, reconstructed)

        return {
            "reconstructed_image_url": f"/uploads/{recon_filename}",
            "selected_actions": selected_actions,
            "disclaimer": cls.MANDATORY_DISCLAIMER,
            "status": "SIMULATION_SUCCESS"
        }
