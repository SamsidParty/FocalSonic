import { Vibrant } from "node-vibrant/browser";

export async function getAverageColor(img: HTMLImageElement | null) {
  return img.src ? (await Vibrant.from(img!.src).getPalette()).Vibrant : "";
}

export function hexToRgba(hex: string, alpha: number = 1) {
  hex = hex.replace(/^#/, '')

  let r: number, g: number, b: number

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  } else {
    return undefined
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function hslToHex(hsl: string) {
  const [h, s, l] = hsl.split(' ')

  const hue = parseInt(h)
  let saturation = parseInt(s.replace('%', ''))
  let lightness = parseInt(l.replace('%', ''))

  // Convert HSL to RGB
  saturation /= 100
  lightness /= 100

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const secondComponent = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const matchLightness = lightness - chroma / 2

  let red, green, blue

  if (hue < 60) {
    red = chroma
    green = secondComponent
    blue = 0
  } else if (hue < 120) {
    red = secondComponent
    green = chroma
    blue = 0
  } else if (hue < 180) {
    red = 0
    green = chroma
    blue = secondComponent
  } else if (hue < 240) {
    red = 0
    green = secondComponent
    blue = chroma
  } else if (hue < 300) {
    red = secondComponent
    green = 0
    blue = chroma
  } else {
    red = chroma
    green = 0
    blue = secondComponent
  }

  const toHex = (value: number) => {
    const hex = Math.round((value + matchLightness) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}
