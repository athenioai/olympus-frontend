# Design System Specification: The Quiet Authority

## 1. Overview & Creative North Star
This design system is built upon the philosophy of **"Warm Corporate Minimalism."** We are moving away from the rigid, boxy constraints of traditional enterprise software and toward a "High-End Editorial" experience. 

The Creative North Star for this system is **The Quiet Authority.** Like a premium gallery or a bespoke architectural firm, the interface should feel expensive, intentional, and calm. We achieve this not through decorative elements, but through the extreme precision of whitespace, the rejection of structural lines, and a sophisticated tonal hierarchy. We do not use borders to separate ideas; we use distance and subtle shifts in light.

## 2. Colors & Tonal Hierarchy
The palette is rooted in a "Stone" foundation (`surface` #faf9f7), creating a warmer, more human environment than clinical white. Our accents—Amber and Teal—are used with surgical precision to guide intent rather than decorate.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined through background color shifts or extreme whitespace.
*   Use `surface` (#faf9f7) as your base canvas.
*   Use `surface-container-low` (#f4f4f1) to define secondary content regions.
*   Use `surface-container-high` (#e6e9e6) for interactive elements that need to pull forward.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of fine paper. 
1.  **Base:** `surface`
2.  **Sectioning:** `surface-container-low`
3.  **Components (Cards/Modals):** `surface-container-lowest` (#ffffff) to create a "lifted" feel against the warmer stone background.
4.  **Interaction:** `surface-container-highest` (#e0e3e0) for hovered states or pressed regions.

### The "Glass & Gradient" Rule
To elevate the system beyond "flat," use Glassmorphism for floating elements (like navigation bars or top-level overlays). Apply `surface` at 80% opacity with a `24px` backdrop blur. For primary CTAs, use a subtle linear gradient from `primary` (#895100) to `primary_dim` (#784700) at a 135-degree angle to provide a "weighted" feel that flat hex codes lack.

## 3. Typography
We utilize a dual-font strategy to balance corporate reliability with editorial character.

*   **Display & Headlines (Manrope):** Manrope’s geometric yet open curves provide the "Warm" in our minimalism. Headlines should feature tighter tracking (-2%) and generous line heights (1.2–1.4) to feel like a premium broadsheet.
*   **Body & UI (Inter):** Inter is used for all functional text. It provides maximum legibility at small sizes. Ensure body text uses the `on_surface_variant` (#5c605d) to reduce harsh contrast and maintain the "warm" aesthetic.

**Scale Usage:**
*   **Display-LG (3.5rem):** Reserved for hero moments. Use sparingly to create a sense of scale.
*   **Headline-MD (1.75rem):** The primary driver for section titles.
*   **Body-MD (0.875rem):** The standard for all functional copy.

## 4. Elevation & Depth
Depth in this system is organic, not artificial. We avoid the "floating card" look of the 2010s in favor of **Tonal Layering.**

### The Layering Principle
Instead of shadows, we stack. A `surface-container-lowest` (#ffffff) card placed on a `surface-container-low` (#f4f4f1) background creates a natural, soft edge that feels architectural.

### Ambient Shadows
Shadows are only permitted for "Floating" elements (Modals, Dropdowns). 
*   **Spec:** `Y: 8px, Blur: 24px, Spread: 0`.
*   **Color:** Use `on_surface` (#2f3331) at 4% to 6% opacity. It must look like a soft glow of ambient light, not a dark smudge.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., an input field), use a "Ghost Border": `outline_variant` (#afb3b0) at **15% opacity**. It should be barely visible, acting more as a hint than a wall.

## 5. Components

### Buttons
*   **Primary:** `primary` (#895100) background with `on_primary` (#fff6f1) text. 12px (`md`) corner radius. Use the signature gradient for depth.
*   **Secondary:** No background, no border. Use `primary` text with a 4% `primary` background tint on hover.
*   **Tertiary:** `tertiary` (#5e5f5e) text for low-priority actions.

### Cards & Lists
*   **Cards:** Never use borders. Use `surface-container-lowest` to pop against `surface-container-low`. Padding should be a minimum of `32px` to emphasize "Breathing Room."
*   **Lists:** Forbid divider lines. Separate list items using vertical spacing (16px minimum). Use a subtle shift to `surface-container-high` on hover to indicate interactivity.

### Input Fields
*   **State:** Default state is a `surface-container-high` (#e6e9e6) fill with no border. 
*   **Focus:** Transition the background to `surface-container-lowest` and apply a 1px `primary` "Ghost Border" at 30% opacity. This "lights up" the field from within.

### Chips
*   Use `secondary_container` (#9ff0fb) for informational chips and `tertiary_container` (#f4f3f1) for filter chips. The low-saturation teal provides a professional "tech-forward" accent without overwhelming the stone base.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. For example, left-align a headline while right-aligning the body copy to create an editorial "path for the eye."
*   **Do** embrace the "Stone" color. Avoid pure white (#ffffff) unless it is a specific "lifted" component.
*   **Do** increase whitespace by 20% more than you think is necessary.

### Don't
*   **Don't** use 100% black text. Use `on_surface` (#2f3331) for a softer, more premium reading experience.
*   **Don't** use 1px solid dividers. If you need a break, use a `32px` or `64px` gap.
*   **Don't** use sharp corners. Stick strictly to the `12px` (0.75rem) radius for all containers to maintain the "Warm" personality.