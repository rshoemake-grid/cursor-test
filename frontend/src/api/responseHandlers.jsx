function extractData(response) {
  return response.data;
}
async function extractDataAsync(responsePromise) {
  const response = await responsePromise;
  return extractData(response);
}
export {
  extractData,
  extractDataAsync
};
