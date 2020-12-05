export const sliceStringFrom = (str: string, start: string) =>
  (((typeof str) === 'string') && !str.startsWith(start)) ?
  str.slice(str.indexOf(start)) :
  str;