function extractData(response) {
  if (
    response !== null &&
    typeof response === "object" &&
    !Array.isArray(response) &&
    Object.prototype.hasOwnProperty.call(response, "data")
  ) {
    return response.data;
  }
  return response;
}

async function extractDataAsync(responsePromise) {
  const response = await responsePromise;
  return extractData(response);
}

export { extractData, extractDataAsync };
