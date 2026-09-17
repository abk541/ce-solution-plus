# CE Solution Plus — 3D generation handoff

The live site currently uses a lightweight procedural Three.js version of the
Mission-Readiness Gimbal. These prompts are for producing a higher-fidelity
art-directed asset in Manus and rebuilding it as a web scene in Spline without
changing the concept or motion language.

## 1. Paste into Manus Design

```text
Create only a production concept asset for the homepage hero of CE Solution
Plus, a credible veteran- and woman-owned U.S. government mission-support
contractor. Do not design a webpage.

Design a single object called MISSION-READINESS GIMBAL.

The object is a precision aerospace stabilization instrument made from six
interlocking, partially segmented rings around one compact faceted command
core. The six rings represent:
1. Staffing
2. Facility Operations & Maintenance
3. Training
4. Professional Services
5. Construction
6. Transportation

It must communicate disciplined power, readiness, precision, coordinated
execution, and stability under pressure. The silhouette should feel engineered
by an aerospace or advanced-systems firm—not like fantasy art, a weapon, a
spaceship, a cryptocurrency graphic, or a generic glowing orb.

VISUAL LANGUAGE
- Anodized deep-navy structural metal: #10283E
- Federal cobalt and ceramic armor: #163B5C and #1F5078
- Brushed cool steel: #BFD0DC
- Mineral edge highlights: #F2F3EF
- Exactly six tiny recessed alignment locks in #FF5C3D; vermilion must occupy
  less than 2% of the object
- Crisp machined seams, restrained bevels, physically plausible materials
- Cool studio key and rim lighting; no bloom

COMPOSITION
- Three-quarter front view with a subtle upward camera angle
- Object weighted toward the right side
- Strong readable silhouette on a transparent background
- Leave the left 45% of a 16:9 composition visually quiet for HTML headline
- Also provide a centered, front-facing version for image-to-3D reconstruction

DO NOT INCLUDE
Text, letters, logos, flags, government seals, service emblems, eagles, stars,
weapons, shields, rockets, random diagonal lines, flat blue rectangles,
holographic dashboards, HUD clutter, glassmorphism, gold, purple neon, casino
lighting, excessive bloom, smoke, sparks, or lens flare.

DELIVERABLES
1. Three distinct concept renders.
2. Select the strongest based on silhouette and credible industrial design.
3. Front, three-quarter, side, and rear reference views with consistent
   proportions.
4. One 2048×2048 transparent PNG of the chosen three-quarter view.
5. If genuine 3D export is available, provide a web-ready GLB with embedded PBR
   materials, fewer than 50,000 triangles, textures no larger than 1024px,
   centered origin, clean normals, and no baked background.
6. If GLB export is unavailable, say so clearly and return the transparent
   reference PNGs for Spline image-to-3D. Do not call a flat render a 3D model.
7. Do not generate a video.
```

## 2. Paste into Spline AI Agent

Attach the chosen transparent Manus render, then paste the following prompt.

```text
Create a lightweight production website scene named MissionReadinessGimbal
using the attached concept as visual reference. Rebuild it primarily from
clean native Spline primitives, curves, and reusable components so it is
sharper and lighter than a dense generated mesh.

OBJECT HIERARCHY — USE THESE EXACT NAMES
MissionReadinessGimbal
  ScrollHandoffRig
    PointerStabilizerRig
      ReadinessPulseRig
        CE_Ring_01_Staffing
        CE_Ring_02_Facilities
        CE_Ring_03_Training
        CE_Ring_04_ProfessionalServices
        CE_Ring_05_Construction
        CE_Ring_06_Transportation
        CE_ServiceLineLocks_06
        CE_FacetedCommandCore
        CE_ReadinessCore
Camera_Desktop
Camera_Mobile

FORM
- Six incomplete precision rings with deliberately indexed openings
- Each ring has a slightly different diameter, axis, and machined profile
- A compact faceted cobalt command core at the center
- Six tiny vermilion alignment locks, one per service line
- Transparent scene background
- Main object occupies the right 48% of a 16:9 hero
- Preserve the left 45% as completely clear negative space for HTML copy
- Create a mobile camera with the object centered in the upper 42% of a 4:5
  viewport

MATERIALS AND LIGHTING
- #10283E deepest structure and recesses
- #163B5C and #1F5078 ring bodies and core facets
- #BFD0DC brushed edges
- #F2F3EF restrained edge highlights
- #FF5C3D only on the six small locks
- Maximum two lights
- No floor, fog, physics, reflection layer, post-processing bloom, text, logo,
  seal, or particle cloud

PURPOSEFUL MOTION
1. INTRO — plays once, total 1.55 seconds. The six rings arrive from shallow
   depth offsets and rotate 10–18 degrees into mechanically locked positions.
   The core activates through material intensity, not a large glow. Firm
   ease-out, no bounce or elastic movement. End in a stable state.
2. IDLE — only subtle stabilization corrections below 1.2 degrees. Never use a
   continuous turntable or perpetual full rotation.
3. POINTER — desktop only. Global pointer movement changes yaw and pitch by no
   more than 4 degrees with high damping. Return slowly to neutral. Disable
   click-drag orbit, pan, and zoom.
4. CLICK — one brief alignment pulse: the six locks brighten and the rings
   compress by no more than 2%, then immediately settle. No explosion.
5. HERO TO ABOUT — over roughly 650px of page scroll, align the six rings
   progressively face-on, compress their depth, move the object slightly toward
   the camera, and fade it as the next section grid takes over. The transition
   must read as a system lock and handoff, not disintegration.

RESPONSIVE AND ACCESSIBILITY
- Under 1024px, use Camera_Mobile and render a static final pose or a single
  compositor-friendly entrance; no pointer motion and no continuous loop.
- Create Boolean variable motionEnabled. When false, immediately show the final
  assembled state and disable intro, pointer, click, and scroll motion.
- Keep page scrolling enabled; disable touch orbit, pan, and zoom.

PERFORMANCE TARGETS
- Under 45,000 triangles; prefer under 20 rendered objects
- Two lights maximum and shared material assets
- No texture above 1024px; prefer no image textures
- No Gaussian splats, physics, reflection layer, hidden geometry, or unused
  assets
- Renderer Auto, Geometry Performance, transparent background, lazy loading
- Verify at 1440×900, 1024×768, 390×844, and 360×800
- The exported scene should remain below 2 MB

Before export, run Spline's Performance Panel and resolve every red item.
```

## Return these files/details for integration

- Published `.splinecode` URL or Spline Viewer embed snippet
- Manus transparent PNG and real GLB, if Manus produced one
- Desktop and mobile screenshots from Spline
- Confirmation that the Spline Performance Panel has no red issues
- Export settings: transparent background, Renderer Auto, Geometry Performance,
  page scroll enabled, orbit/pan/zoom disabled, lazy loading enabled

The replacement should remain a single live WebGL scene. It must replace the
procedural hero scene rather than being layered on top of it.
