export function fetchPercentece(response, background,elementMirror = $('#state.loading')){
  const contentLength = response.headers.get('Content-Length');
  // Gets length in bytes (must be provided by server)
  let loaded = 0;
  // Will be used to track loading
  return new Response(
	new ReadableStream({
	// Creates new readable stream on the new response object
	  start(controller) {
	  // Controller has methods on that allow the new stream to be constructed
		const reader = response.body.getReader();
		// Creates a new reader to read the body of the fetched resources
		read();
		// Fires function below that starts reading
		function read() {
		  reader.read()
		  .then((progressEvent) => {
		  // Starts reading, when there is progress this function will fire
			if (progressEvent.done) {
			  controller.close();
			  return; 
			  // Will finish constructing new stream if reading fetched of resource is complete
			}
			loaded += progressEvent.value.byteLength;
			// Increase value of 'loaded' by latest reading of fetched resource
			const percentace = Math.round((loaded/contentLength)/120*1000)+'%'
			elementMirror.style = `background: linear-gradient(90deg, ${background} ${percentace}, transparent ${percentace});font-size:1.5rem;`
			
			// Displays progress via console log as %
			controller.enqueue(progressEvent.value);
			// Add newly read data to the new readable stream
			read();
			// Runs function again to continue reading and creating new stream
		  })
		}
	  }
	})
  );
}