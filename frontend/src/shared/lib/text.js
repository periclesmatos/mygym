export function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

export function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`
}
