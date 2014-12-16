node-squarespace-middleware
===========================

> Middleware for interfacing with a Squarespace site using a third-party node-js app.


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
var sqsMiddleware = require( "node-squarespace-middleware" );

// Set config values
sqsMiddleware.set( "siteurl", "https://yoursite.squarespace.com" );
sqsMiddleware.set( "useremail", "youremail" );
sqsMiddleware.set( "userpassword", "yourpassword" );

// If you have a sitewide password enabled
sqsMiddleware.set( "sitepassword", "yoursitepassword" );

// If you are using a site in sandbox trial mode
sqsMiddleware.set( "sandboxmode", true );
```

#### Authentication
```javascript
// Perform the auth login
sqsMiddleware.doLogin(function ( headers ) {
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
}, null, function ( data ) {
    // data = JSON for page collection
});


// Get json for a page
// Pass null for {qrs} hash if not passing query string
sqsMiddleware.getJson( "work", null, function ( data ) {
    // data = {json, status}
});


// Get html for a page
// Pass null for {qrs} hash if not passing query string
sqsMiddleware.getHtml( "work", null, function ( data ) {
    // data = {html, status}
});


// Get html AND json for a page
// Pass null for {qrs} hash if not passing query string
sqsMiddleware.getJsonAndHtml( "work", null, function ( data ) {
    // data = {json: {json, status}, html: {html, status}}
});


// Get API data for collections and siteLayout
sqsMiddleware.getAPIData(function ( data ) {
    // data = {collections, siteLayout}
});


// Get a block rendered through LayoutEngine
// This is a complicated process and is primarily in place to support the node-squarespace-server
// But for example, this is how you would render the first block for a given block id
sqsMiddleware.getBlockJson( blockId, function ( json ) {
    // get just the first block
    var block = json.data.layout.rows[ 0 ].columns[ 0 ].blocks[ 0 ]

    sqsMiddleware.getWidgetHtml( block, function ( data ) {
        // data = {html}, or the rendered html for the block widget
    });
});
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
- getBlockJson( blockId, callback )
- getWidgetHtml( blockJSON, callback )



### Pull Requests
1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
