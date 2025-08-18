
const removeUndefined = (obj) => (true || Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key])) && obj;

export default removeUndefined;