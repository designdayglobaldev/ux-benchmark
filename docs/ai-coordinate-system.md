# Implementing an AI-Powered UI Analysis System with Coordinate Targeting

In modern application development, integrating AI isn't just about sending text prompts to a language model; it's about providing rich, multimodal context. For applications dealing with UI/UX analysis, users need a way to ask the AI questions about *specific* parts of a screen, rather than the entire image. 

This document details the implementation of a sophisticated AI-powered UI analysis system that allows users to draw a bounding box over any part of a UI screenshot and send those precise coordinates to an AI for localized feedback.

---

## 1. Introduction & Overview

When asking an AI to "analyze this UI," a Vision-Language Model (VLM) will typically look at the entire image and provide generalized feedback. While useful, this lacks the precision needed for rigorous UX audits. 

**The Solution:** We built an interactive layer over our UI screenshots that lets users click and drag to select a specific region (e.g., a button, a navigation bar, or a card component). We then capture the normalized coordinates of this region and send them alongside the user's prompt to the AI backend.

**High-Level Architecture:**
1.  **RegionSelector (Client):** An interactive React component that handles mouse events to draw bounding boxes and calculate relative coordinates.
2.  **Context & State (Client):** React Context and local state to pass the selected region data down to the chat interface.
3.  **Chat Interface (Client):** A floating panel where users can type prompts, see their active target region, and view the AI's response.
4.  **Backend Integration:** An API endpoint that receives the image identifier, text prompt, and the `[x, y, width, height]` coordinates to process via the AI model.

---

## 2. Building the Interactive Region Selector

The core of the user experience is the `RegionSelector` component (`RegionSelector.tsx`). This component overlays the target image and listens for mouse and touch interactions to create a precise selection box. We built this from scratch using React state and DOM APIs to ensure maximum performance and control without relying on heavy third-party cropping libraries.

### State Management
The component relies on four primary pieces of local state:
*   **`isDrawing`** (boolean): Tracks whether the user is currently dragging to create a selection.
*   **`startPoint`** (`{ x, y }`): The initial coordinate where the user first clicked.
*   **`currentPoint`** (`{ x, y }`): The real-time coordinate of the cursor as it moves.
*   **`selectionBox`** (`Region | null`): The final, committed bounding box containing `x`, `y`, `width`, and `height`.

### Event Handling and Coordinate Math
To draw a box, we need to know exactly where the user is interacting relative to the *image container*, not the viewport. We achieve this using `getBoundingClientRect()` on a `ref` attached to the overlay container.

We created a helper function, `getCoordinates`, to calculate this relative position. Crucially, this function supports both standard mouse events and mobile touch events:

```typescript
const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
  const rect = overlayRef.current.getBoundingClientRect();
  let clientX, clientY;
  
  if ('touches' in e) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = (e as React.MouseEvent).clientX;
    clientY = (e as React.MouseEvent).clientY;
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
};
```

This math guarantees that our `(x, y)` coordinate (0,0) is always the top-left pixel of the image container, regardless of scroll position or window size.

### The Dragging Lifecycle
We bound three primary event handlers to the overlay container:

1.  **`handleMouseDown` / `onTouchStart`**: Fires when the user clicks or taps. If a selection doesn't already exist, it sets `isDrawing` to true and records the `startPoint` and initial `currentPoint`.
2.  **`handleMouseMove` / `onTouchMove`**: Fires as the cursor moves. If `isDrawing` is true, it rapidly updates the `currentPoint` state.
3.  **`handleMouseUp` / `onTouchEnd`**: Finalizes the interaction. This is where we calculate the final dimensions of the box.

Because users can drag in any direction (e.g., bottom-right to top-left), we use `Math.min` and `Math.abs` to ensure the resulting coordinates always represent the top-left corner and a positive width/height:

```typescript
const x = Math.min(startPoint.x, currentPoint.x);
const y = Math.min(startPoint.y, currentPoint.y);
const width = Math.abs(currentPoint.x - startPoint.x);
const height = Math.abs(currentPoint.y - startPoint.y);
```

### Edge Cases and Polish
*   **Accidental Clicks (Minimum Size Guard):** If a user simply clicks the screen without dragging, it would theoretically create a 0x0 pixel bounding box. To prevent this, we enforce a minimum size. If `width > 20 && height > 20` is false, we discard the selection entirely.
*   **Inspect Mode Prompt:** When no box is drawn, we render a pulsing tooltip (`animate-pulse`) in the center of the screen that says "Inspect Mode - Click & drag anywhere". This immediately educates the user on how to use the feature.
*   **Visual Feedback:** The box itself is rendered as an absolutely positioned `div` using inline styles for `left`, `top`, `width`, and `height`. We style it with Tailwind CSS (`border-2 border-blue-500 bg-blue-500/10`) to provide a crisp, semi-transparent blue overlay that highlights the targeted UI element without completely obscuring it.

---

## 3. Integrating the Chat Interface

Once a region is selected, that data must be seamlessly passed to the chat component and eventually the backend. This is handled entirely within `Middle.tsx`.

### State Management and Context
The `Middle` component maintains local state for the active selection using `useState<Region | null>(null)`. It also holds a `ref` to the actual `<img>` element (`imgRef`). When the user draws a bounding box via the `RegionSelector`, the `onSelectRegion` callback updates this local state with the relative pixel coordinates.

### The Target Indicator
To reassure the user that the AI knows *where* to look, the chat input dynamically renders a "Target Badge" when a region is actively held in state. 

```tsx
{selectedRegion && (
    <div className="px-4 pt-3 flex items-center justify-between">
        <div className="bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs px-2 py-1 rounded flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Specific area targeted
        </div>
        <button onClick={() => setSelectedRegion(null)} className="text-zinc-400 underline">
            Clear target
        </button>
    </div>
)}
```
This badge sits cleanly inside the text input area. The "Clear target" button allows users to quickly dismiss the bounding box and ask a general question about the whole screen instead.

### Form Submission and Coordinate Scaling
The most critical part of the integration happens when the user clicks submit (`handleAiSubmit`). 

Because the user draws the box on a dynamically scaled image (e.g., an image shrunk to fit a mobile screen), the bounding box coordinates are relative to that *shrunk* container. However, the AI backend needs coordinates relative to the *original, full-resolution* image.

We solve this by calculating the scale ratio using the `imgRef`'s natural dimensions versus its client dimensions:

```typescript
let scaledRegion = null;
if (selectedRegion) {
    const scaleX = imgRef.current.naturalWidth / imgRef.current.clientWidth;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.clientHeight;
    
    scaledRegion = {
        x: selectedRegion.x * scaleX,
        y: selectedRegion.y * scaleY,
        width: selectedRegion.width * scaleX,
        height: selectedRegion.height * scaleY
    };
}
```

### Image Extraction and Payload
Before sending the request, we extract the image data directly from the DOM using a hidden HTML Canvas. This allows us to send the exact image the user is looking at without requiring a separate network request to fetch the image file again:

```typescript
const canvas = document.createElement('canvas');
canvas.width = imgRef.current.naturalWidth;
canvas.height = imgRef.current.naturalHeight;
const ctx = canvas.getContext('2d');
ctx.drawImage(imgRef.current, 0, 0);
const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
```

The final payload sent to the `/api/v1/ai/inspect` endpoint includes the text `prompt`, the `scaledRegion`, and the `imageBase64` string. Upon a successful response, both the prompt and the `selectedRegion` state are cleared.

---

## 4. Designing a Seamless Loading Experience

AI models, especially Vision models processing Base64 image payloads, can take several seconds to generate a response. Presenting a static spinner during this time leads to high perceived latency and user frustration. We engineered a dual-part loading experience to make the wait feel shorter and more engaging.

### Dynamic Status Messages
To give the illusion of real-time analytical progress, we cycle through an array of status messages. 

We store the messages in a static array and use a `loadingMessageIndex` state variable to track the current position. A `useEffect` hook sets up an interval that increments the index every 2 seconds while the `isAiLoading` or `isInsightsLoading` states are true:

```tsx
const loadingMessages = [
    "Analyzing UI elements...",
    "Identifying UX patterns...",
    "Applying design heuristics...",
    "Formulating insights...",
    "Almost done..."
];

useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAiLoading || isInsightsLoading) {
        interval = setInterval(() => {
            setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 2000);
    } else {
        setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
}, [isAiLoading, isInsightsLoading]);
```
This text is rendered with an `animate-pulse` utility class to give it a soft breathing effect, keeping the interface feeling alive.

### The CSS Triple-Dot Loader (Pivoting from Lottie)
Initially, we attempted to use a complex Lottie JSON animation for the visual loader. However, we encountered significant issues: Vite's JSON loader and various React wrappers (`lottie-react`, `@lottiefiles/react-lottie-player`) struggled with ESM/CJS interop and SVG path corruption within conditionally rendered components. The Lottie animation would mount but render completely invisible.

**The Pivot:** Instead of fighting dependency heavy libraries for a simple animation, we replaced the Lottie implementation with a pure CSS React implementation. We built a staggered "Triple Dot Loader" using Tailwind CSS, mimicking the exact cyan color (`#26D6C2`) from the original Lottie design:

```tsx
<div className="flex gap-1.5 items-center justify-center">
    <div className="w-2 h-2 rounded-full bg-[#26D6C2] animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 rounded-full bg-[#26D6C2] animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 rounded-full bg-[#26D6C2] animate-bounce" style={{ animationDelay: '300ms' }} />
</div>
```

**Why this is superior:**
1.  **Zero Dependencies:** We completely removed `lottie-web` and its React wrappers, shaving megabytes off our node_modules and drastically reducing the client bundle size.
2.  **Guaranteed Rendering:** Native DOM elements and CSS keyframes (`animate-bounce`) are handled by the browser's GPU rendering engine, making them 100% reliable across all modern devices and completely immune to JavaScript module bundling quirks.
3.  **Perfect Control:** Staggering the animation is achieved effortlessly with inline `animationDelay` styles, creating a smooth, elegant wave effect that rivals complex vector animations.

---

## 5. The Backend Integration (Connecting to the AI)

With the client-side UX polished and the payload prepared, the final step is bridging the gap to the AI model. Our backend uses **Express** and the official **Anthropic SDK** to communicate with Claude models.

### Express Route and Payload Handling
We expose a POST endpoint at `/api/v1/ai/inspect`. The first order of business is validating and sanitizing the incoming payload:

```typescript
router.post('/inspect', async (req, res) => {
    const { prompt, region, imageBase64 } = req.body;

    if (!prompt || !imageBase64) {
        return res.status(400).json({ error: 'Missing prompt or imageBase64' });
    }

    // Ensure the image string doesn't contain the data URI prefix
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    // ...
```
Because the Anthropic API expects raw Base64 data without the `data:image/jpeg;base64,` prefix, we aggressively strip it out using a regex.

### Dynamic Context Injection
To tell the AI exactly where to look, we inject the scaled coordinates directly into the user's prompt as invisible context:

```typescript
let regionContext = '';
if (region && typeof region.x === 'number') {
    regionContext = `The user has highlighted a specific region of this screen (x: ${Math.round(region.x)}, y: ${Math.round(region.y)}, width: ${Math.round(region.width)}, height: ${Math.round(region.height)}). `;
}
```
We round these values using `Math.round` to prevent confusing the model with long floating-point numbers.

### Prompt Engineering for Claude 3.5 Sonnet
We utilize the `claude-sonnet-5` model due to its exceptional multimodal vision capabilities and speed. The system prompt is heavily engineered to lock the model into a specific persona and force it to respect the bounding box:

```typescript
const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system: "You are an expert UX/UI designer and software engineer. Analyze the provided screenshot and answer the user's question. If they highlighted a region, focus specifically on that region and its context within the broader screen.",
    messages: [
    {
        role: 'user',
        content: [
        {
            type: 'image',
            source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data,
            },
        },
        {
            type: 'text',
            text: `${regionContext}User's Question: ${prompt}`,
        }
        ],
    },
    ],
});
```

By explicitly commanding Claude in the system prompt to "focus specifically on that region" if highlighted, we drastically improve the relevance of the response. The model is now capable of interpreting a question like "Why is this text unreadable?" and correctly deducing that the user is talking about a low-contrast button inside the bounding box at `X: 450, Y: 120`.

---

## 6. Challenges & Lessons Learned

Building a seemingly simple "draw a box and ask an AI" feature exposed several deep technical complexities, primarily around state management, image scaling, and modern frontend tooling.

### The Coordinate Scaling Disparity
The most significant hurdle was the realization that the coordinates generated by user interactions do not match the image the AI analyzes.
*   **The Problem:** A user might be viewing an image on a small laptop screen where the image is rendered at `400px` by `800px`. They draw a box at `(x: 100, y: 100)`. However, the original image sent to the AI might be `1200px` by `2400px`. If we tell the AI to look at `(100, 100)`, it will look at the completely wrong part of the high-resolution image.
*   **The Lesson:** Never trust CSS pixels for image analysis. We had to implement a strict mapping layer (the `scaleX` and `scaleY` multipliers) right before API submission to translate DOM interaction pixels back into the original image's native color space and resolution matrix. 

### The Lottie + Vite ESM Interop Disaster
We spent a considerable amount of time attempting to integrate a complex vector JSON animation using `lottie-react` and `@lottiefiles/react-lottie-player`.
*   **The Problem:** Modern bundlers like Vite parse `.json` files into JavaScript objects by default. When Vite processed the massive, deeply nested Lottie JSON file, it subtly corrupted the data structure before the Lottie player could read it. The component mounted successfully (taking up DOM space), but the SVG paths were rendered invisibly.
*   **The Lesson:** For UI micro-interactions (like loading spinners or success checks), heavy vector animation libraries are often overkill and introduce severe tooling brittleness. Native CSS animations (`animate-bounce`, `animate-pulse`) are significantly more resilient, vastly lighter on the bundle size, and immune to bundler configuration quirks.

### Bypassing Network Overhead with the DOM Canvas
Initially, when a user submitted a prompt, we considered fetching the image URL again from our storage bucket to convert it to Base64 for the AI.
*   **The Problem:** This introduces latency (waiting for a network request to finish) and unnecessary bandwidth costs, especially for high-resolution images.
*   **The Lesson:** The image data already exists in the user's browser memory (rendered in the `<img>` tag). By rendering the `imgRef` directly onto a hidden HTML5 `<canvas>` and calling `toDataURL()`, we achieved instantaneous, zero-latency image extraction directly from the DOM. This dramatically sped up the perceived performance of the chat interface.

## 7. Conclusion

By combining custom React event handling, normalized coordinate geometry, engaging loading states, and precise backend prompt engineering, we've created an AI UI Analysis tool that feels native, responsive, and incredibly powerful. 

This foundation not only supports the current Q&A workflows but opens the door for future enhancements, such as multi-region selection, auto-detecting UI components before the user clicks, and automated accessibility auditing of specific DOM nodes.
