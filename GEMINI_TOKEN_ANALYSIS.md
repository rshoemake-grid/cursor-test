# Gemini Token Counting Analysis

## Problem Statement

Gemini API is rejecting requests with error: "The input token count exceeds the maximum number of tokens allowed 1048576"

Our estimate shows: **584,025 tokens** (well under the 1,048,576 limit)

## Current Implementation Analysis

### Image Token Calculation (WRONG!)

**Current code (lines 496-500, 559-562):**
```python
# Gemini counts tokens based on image dimensions:
# - Images are divided into 512x512 pixel tiles
# - Each tile = 85 tokens
# - Base image = 85 tokens
# Max tokens = 1,048,576

tiles_per_width = (width + 511) // 512  # Round up
tiles_per_height = (height + 511) // 512  # Round up
total_tiles = tiles_per_width * tiles_per_height
estimated_tokens = total_tiles * 85 + 85
```

**Example calculation for 1024x1024 image:**
- Tiles: (1024+511)//512 = 2 tiles per side = 4 tiles total
- Tokens: 4 * 85 + 85 = **425 tokens**

### Actual Gemini Token Calculation (CORRECT!)

According to official Gemini API documentation:

**For Gemini 2.0 Flash and later:**
- Images with **both dimensions <=384 pixels**: **258 tokens** per image
- Images larger in one or both dimensions: **tiled into 768x768 pixel tiles**, each tile = **258 tokens**

**Correct calculation for 1024x1024 image:**
- Tiles: (1024+767)//768 = 2 tiles per side = 4 tiles total
- Tokens: 4 * 258 = **1,032 tokens** (not 425!)

**After resize to ~600px:**
- Tiles: (600+767)//768 = 1 tile per side = 1 tile total
- Tokens: 1 * 258 = **258 tokens** (not 425!)

### The Problem

1. **Wrong tile size**: We're using 512x512 tiles, but Gemini 2.0+ uses **768x768 tiles**
2. **Wrong tokens per tile**: We're using 85 tokens per tile, but Gemini 2.0+ uses **258 tokens per tile**
3. **Wrong base tokens**: We're adding 85 base tokens, but Gemini doesn't add base tokens for tiled images

### Impact on Our Estimates

**Original 1024x1024 image:**
- Our estimate: 425 tokens
- Actual: 1,032 tokens
- **Difference: 607 tokens (143% underestimate!)**

**Resized to ~600px:**
- Our estimate: 425 tokens  
- Actual: 258 tokens
- **Difference: 167 tokens (39% overestimate, but this is less critical)**

**Resized to ~800px:**
- Our estimate: (800+511)//512 = 2 tiles = 425 tokens
- Actual: (800+767)//768 = 2 tiles = 516 tokens
- **Difference: 91 tokens (21% underestimate)**

### Text Token Calculation

**Current implementation:**
```python
text_tokens = len(text) // 4  # ~4 chars per token
```

This appears correct according to documentation: "For Gemini models, a token is equivalent to about 4 characters."

However, **583,600 text tokens** seems extremely high. This would be:
- 583,600 tokens * 4 chars/token = **2,334,400 characters**
- That's over 2.3 million characters of text!

This suggests either:
1. The text content is actually that large (unlikely)
2. We're double-counting text tokens
3. We're counting something as text that shouldn't be

### System Instruction Tokens

System instructions are added separately in the request:
```python
request_data["systemInstruction"] = {
    "parts": [{"text": self.config.system_prompt}]
}
```

We ARE counting system prompt in text tokens (line 540-542), which is correct. But we need to verify we're not double-counting.

### Base64 Data Tokens

**CRITICAL FINDING:** According to documentation:
> "An image's display or file size does not affect its token count."

This means **base64 data size does NOT count as tokens** - only image dimensions matter!

Our current code estimates base64 tokens (line 800), but this is incorrect. Base64 size is only relevant for:
- Request size limits (20MB max for inline data)
- Bandwidth/performance
- NOT token counting

## Root Cause Analysis

### Why Gemini Rejects Our Request

1. **Image token underestimate**: We're calculating ~425 tokens for a resized image, but it's actually ~258-516 tokens depending on size. However, this alone wouldn't cause rejection.

2. **Text token overestimate**: We're calculating 583,600 text tokens, which seems way too high. If this is correct, that alone would exceed the limit when combined with image tokens.

3. **Combined total**: 
   - Our estimate: 425 (image) + 583,600 (text) = 584,025 tokens
   - If text is actually correct: 258-516 (image) + 583,600 (text) = 583,858-584,116 tokens
   - Still under limit, but very close

4. **System instruction overhead**: System instructions count as tokens, and we're including them in text tokens. This should be correct.

5. **Request structure overhead**: The JSON structure itself might add some overhead, but this should be minimal.

### The Real Issue

Looking at the logs:
- Line 957: `Total text tokens: 583,600`
- This is the smoking gun!

**583,600 tokens = 2,334,400 characters of text**

This is an enormous amount of text. Possible causes:
1. The system prompt is extremely long
2. We're including image base64 data in text token calculation (WRONG!)
3. We're double-counting text from multiple sources
4. The input data contains massive amounts of text

## Solutions

### Immediate Fixes

1. **Fix image token calculation** to use correct tile size and tokens:
   ```python
   # For Gemini 2.0 Flash and later
   if width <= 384 and height <= 384:
       estimated_tokens = 258
   else:
       tiles_per_width = (width + 767) // 768  # 768x768 tiles
       tiles_per_height = (height + 767) // 768
       total_tiles = tiles_per_width * tiles_per_height
       estimated_tokens = total_tiles * 258  # 258 tokens per tile
   ```

2. **Remove base64 token estimation** - base64 size doesn't count as tokens

3. **Investigate text token calculation** - 583,600 tokens is way too high. Need to:
   - Log actual text content being counted
   - Verify we're not counting image data as text
   - Check if system prompt is extremely long
   - Verify no double-counting

4. **Add actual token counting** - Use Gemini's `countTokens` API before sending to verify our estimates

### Long-term Improvements

1. Use Gemini's `countTokens` API to verify token counts before sending
2. Add better logging to show what's being counted as text tokens
3. Consider using File API for large images instead of inline data
4. Add token count validation with actual API before sending

## Next Steps

1. Fix image token calculation to use 768x768 tiles and 258 tokens per tile
2. Remove base64 token estimation (it doesn't count)
3. Add detailed logging to see what's contributing to 583,600 text tokens
4. Consider using Gemini's countTokens API to verify before sending
5. Test with corrected calculations

## References

- [Gemini API Token Counting Guide](https://ai.google.dev/gemini-api/docs/tokens)
- [Gemini API Image Understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Firebase AI Logic Token Counting](https://firebase.google.com/docs/ai-logic/count-tokens)

