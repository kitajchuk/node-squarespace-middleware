node-squarespace-middleware
===========================

> Interface with a Squarespace site using a node.js application.


### Installation
```shell
npm install node-squarespace-middleware
```

#### Updating
```shell
npm update node-squarespace-middleware
```



### Usage

#### Configuration
```javascript
// Get the middleware module
var nsm = require( "node-squarespace-middleware" );
var sqsMiddleware = new nsm.Middleware();

// Set config values
sqsMiddleware.set( "siteurl", "https://yoursite.squarespace.com" );
sqsMiddleware.set( "useremail", "youremail" );
sqsMiddleware.set( "userpassword", "yourpassword" );

// If you have a sitewide password enabled
sqsMiddleware.set( "sitepassword", "yoursitepassword" );

// If you are using a site in sandbox trial mode
sqsMiddleware.set( "sandboxmode", true );

// If you dont need to pre-fetch full collection data...
sqsMiddleware.set( "fulldata", false );
```

#### Authentication
```javascript
// Perform the auth login
sqsMiddleware.doLogin(function ( error, headers ) {
    // Do stuff here
    // headers = validated headers
});
```

#### Request Interface
```javascript
// Perform a squarespace:query
sqsMiddleware.getQuery({
    collection: "work",
    featured: true,
    limit: 6

// Pass null for {qrs} hash if not passing query string
}, null, function ( error, data ) {
    // data = JSON for page collection
});


// Get json for a page
// Pass null for {qrs} hash if not passing query string
sqsMiddleware.getJson( "work", null, function ( error, data ) {
    // data = {json, status}
});


// Get html for a page
// Pass null for {qrs} hash if not passing query string
sqsMiddleware.getHtml( "work", null, function ( error, data ) {
    // data = {html, status}
});


// Get html AND json for a page
// Pass null for {qrs} hash if not passing query string
sqsMiddleware.getJsonAndHtml( "work", null, function ( error, data ) {
    // data = {json: {json, status}, html: {html, status}}
});


// Get API data for collections and siteLayout
sqsMiddleware.getAPIData(function ( error, data ) {
    // data = {collections, siteLayout}
});


// Get a block rendered through LayoutEngine
// This is a complicated process and is primarily in place to support the node-squarespace-server
// But for example, this is how you would render the first block for a given block id
sqsMiddleware.getBlockJson( blockId, function ( error, json ) {
    // get just the first block
    var block = json.data.layout.rows[ 0 ].columns[ 0 ].blocks[ 0 ]

    sqsMiddleware.getWidgetHtml( block, function ( error, data ) {
        // data = {html}, or the rendered html for the block widget
    });
});


// Retrieve the logged in crumb
sqsMiddleware.getCrumb();
```



### Methods

#### Configuration
- get( key )
- set( key, val )

#### Authentication
- doLogin( callback )

#### Request Interface
- getQuery( data, qrs, callback )
- getJson( url, qrs, callback )
- getHtml( url, qrs, callback )
- getJsonAndHtml( url, qrs, callback )
- getAPIData( callback )
- getAPICollection( collectionId, callback )
- getBlockJson( blockId, callback )
- getWidgetHtml( blockJSON, callback )
- getCrumb()



### Pull Requests
1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
