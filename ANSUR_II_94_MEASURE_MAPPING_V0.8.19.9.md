# ANSUR II ↔ Sammy MEAS Mapping · v0.8.19.9

Quelle: NATICK/TR-11/017 · **94 direkte ANSUR-II-Dimensionen**.

- Direkt in MEAS/PROT abbildbar: **22**
- Protokollgeometrie umgesetzt, Soft-Tissue-/Anspannungsanteil noch approximativ: **2**
- Noch nicht in MEAS implementiert: **70**

## Aktuell in PROT

| ANSUR II | Sammy-ID | Mapping |
|---|---|---|
| Acromion-Radiale Length | `upperarm_length` | direct |
| Ankle Circumference | `ankle_circumference` | direct |
| Biacromial Breadth | `biacromial_breadth` | direct |
| Biceps Circumference, Flexed | `upperarm_circumference` | protocol geometry / soft-tissue partial |
| Buttock Circumference | `buttock_circumference` | direct |
| Calf Circumference | `calf_circumference` | direct |
| Chest Breadth | `chest_breadth` | direct |
| Chest Circumference | `chest_circumference` | direct |
| Chest Depth | `chest_depth` | direct |
| Crotch Height | `crotch_height` | direct |
| Forearm Circumference, Flexed | `forearm_circumference` | protocol geometry / soft-tissue partial |
| Hip Breadth | `hip_breadth` | direct |
| Neck Circumference | `neck_circumference` | direct |
| Neck Circumference, Base | `neck_base_circumference` | direct |
| Radiale-Stylion Length | `lowerarm_length` | direct |
| Shoulder Length | `shoulder_length` | direct |
| Stature | `stature` | direct |
| Thigh Circumference | `thigh_circumference` | direct |
| Tibial Height | `tibiale_height` | direct |
| Waist Back Length (Omphalion) | `waist_back_length` | direct |
| Waist Breadth | `waist_breadth` | direct |
| Waist Circumference (Omphalion) | `waist_circumference` | direct |
| Waist Depth | `waist_depth` | direct |
| Wrist Circumference | `wrist_circumference` | direct |

## Noch nicht in MEAS

- Abdominal Extension Depth, Sitting
- Acromial Height
- Acromion-Wall Depth
- Axilla Height
- Ball of Foot Circumference
- Ball of Foot Length
- Bicristal Breadth
- Bideltoid Breadth
- Bimalleolar Breadth
- Bitragion Chin Arc
- Bitragion Submandibular Arc
- Bizygomatic Breadth
- Buttock Depth
- Buttock Height
- Buttock-Knee Length
- Buttock-Popliteal Length
- Cervicale Height
- Chest Height
- Crotch Length (Omphalion)
- Crotch Length, Posterior (Omphalion)
- Ear Breadth
- Ear Length
- Ear Protrusion
- Elbow Rest Height
- Eye Height, Sitting
- Foot Breadth, Horizontal
- Foot Length
- Forearm-Center of Grip Length
- Forearm-Forearm Breadth
- Forearm-Hand Length
- Functional Leg Length
- Hand Breadth
- Hand Circumference
- Hand Length
- Head Breadth
- Head Circumference
- Head Length
- Heel Ankle Circumference
- Heel Breadth
- Hip Breadth, Sitting
- Iliocristale Height
- Interpupillary Breadth
- Interscye I
- Interscye II
- Knee Height, Midpatella
- Knee Height, Sitting
- Lateral Femoral Epicondyle Height
- Lateral Malleolus Height
- Lower Thigh Circumference
- Menton-Sellion Length
- Overhead Fingertip Reach, Sitting
- Palm Length
- Popliteal Height
- Shoulder Circumference
- Shoulder-Elbow Length
- Sitting Height
- Sleeve Length: Spine-Wrist
- Sleeve Outseam
- Span
- Suprasternale Height
- Tenth Rib Height
- Thigh Clearance
- Thumbtip Reach
- Tragion-Top of Head
- Trochanterion Height
- Vertical Trunk Circumference (USA)
- Waist Front Length, Sitting
- Waist Height (Omphalion)
- Weight
- Wrist Height
## v0.8.19.8 Canonicalization

MEAS und PROT verwenden jetzt dieselben strikten Skin-Weight-Regionen und dieselben Landmark-/Schnittdefinitionen. Die 24 PROT-Zielmaße sind damit die kanonische Schnittstelle für den späteren Solver. Historische Measurement-Lab-Kalibrierungen bleiben als Test-/Einflussdaten erhalten, steuern diese kanonischen Definitionen aber nicht mehr verdeckt.


## v0.8.19.8 calibration note
The 24 direct ANSUR targets remain unchanged. This patch changes audit/editability and corrects flagged mesh geometry without adding non-ANSUR targets. Dynamic landmarks are now represented as **automatic mesh anchor + persistent calibration bias**. Circumference plane tilt is an audit parameter until explicitly approved as canonical geometry.


## v0.8.19.9 focused geometry pass

- **Hip Breadth:** exact lateral extrema of the same horizontal pelvis slice as Buttock Circumference; these are also the two dynamic Buttock-lateral points.
- **Shoulder Length:** straight Trapezius→Acromion projection laid onto the shoulder surface; surface length retained, zig-zag mesh routing removed.
- **Waist Back Length (Omphalion):** vertically straight posterior projection from Waist posterior to canonical Cervicale; depth follows the back contour as required for ANSUR surface distance.
- **Neck Circumference / Base:** PROT exposes a single anatomical sagittal tilt around the left-right body axis for plane calibration.
