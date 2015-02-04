/*!
 *
 * Squarespace Middleware.
 *
 */
var _ = require( "underscore" ),
    request = require( "request" ),
    cookieParser = require( "cookie" ),
    API_GET_SITELAYOUT = "/api/commondata/GetSiteLayout/",
    API_GET_COLLECTIONS = "/api/commondata/GetCollections/",
    API_GET_BLOCKFIELDS = "/api/block-fields/",
    API_GET_WIDGETRENDERING = "/api/widget/GetWidgetRendering/",
    API_AUTH_LOGIN = "/api/auth/Login/",
    // /api/template/GetTemplate?templateId=
    // /api/commondata/GetCollection?collectionId
    // /api/page-collection-data/collectionId=
    sqsUser = null,
    sqsLoginHeaders = null,
    sqsLoginCrumb = null,
    config = {
        siteurl: null,
        sitepassword: null,
        useremail: null,
        userpassword: null,
        sandboxmode: false
    },


/******************************************************************************
 * @Public
*******************************************************************************/

/**
 *
 * @method set
 * @param {string} key The config key to set
 * @param {string} val The config val to set
 * @public
 *
 */
set = function ( key, val ) {
    config[ key ] = val;
},


/**
 *
 * @method get
 * @param {string} key The config key to get value of
 * @public
 *
 */
get = function ( key ) {
    return config[ key ];
},


/**
 *
 * @method doLogin
 * @param {function} callback Fired when login and headers are set
 * @public
 *
 */
doLogin = function ( callback ) {
    var cookie,
        cookieParsed;

    // Ensure proper config is set
    if ( !sqsUser ) {
        sqsUser = {
            email: get( "useremail" ),
            password: get( "userpassword" )
        };
    }

    // POST to login
    request({
        method: "POST",
        url: (get( "siteurl" ) + API_AUTH_LOGIN),
        json: true,
        headers: getHeaders(),
        form: sqsUser

    }, function ( error, response, json ) {
        if ( error ) {
            log( "ERROR - " + error );

            // Errors first
            callback( error, null );

            return;
        }

        // Request to TokenLogin
        request({
            url: json.targetWebsite.loginUrl,
            json: true,
            headers: getHeaders(),
            qs: sqsUser

        }, function ( error, response ) {
            if ( error ) {
                log( "ERROR - " + error );

                // Errors first
                callback( error, null );

                return;
            }

            // Get the response cookie we need
            cookie = response.headers[ "set-cookie" ].join( ";" );
            cookieParsed = cookieParser.parse( cookie );

            // Set request headers we will use
            headers = getHeaders({
                "Cookie": cookie
            });

            // Store headers here
            sqsLoginHeaders = headers;

            // Store crumb here
            sqsLoginCrumb = cookieParsed.crumb;

            // Errors first, there are none :-)
            callback( null, headers );
        });
    });
},


/**
 *
 * @method getAPIData
 * @param {function} callback Fired when data is fetched
 * @public
 *
 */
getAPIData = function ( callback ) {
    var apis = [
            (get( "siteurl" ) + API_GET_SITELAYOUT),
            (get( "siteurl" ) + API_GET_COLLECTIONS),
        ],
        data = {},
        errors = [];

    function getAPI() {
        var api = apis.shift();

        request({
            url: api,
            json: true,
            headers: sqsLoginHeaders,
            qs: sqsUser

        }, function ( error, response, json ) {
            if ( error ) {
                log( "ERROR - " + error );

                errors.push( error );
            }

            // All done, load the site
            if ( !apis.length ) {
                data.collections = json;

                // Errors first
                callback( (errors.length ? errors : null), data );

            } else {
                data.siteLayout = json;

                getAPI();
            }
        });
    }

    getAPI();
},


/**
 *
 * @method getHtml
 * @param {string} url Request url
 * @param {object} qrs Querystring mapping
 * @param {function} callback Fired when done
 * @public
 *
 */
getHtml = function ( url, qrs, callback ) {
    url = (get( "siteurl" ) + "/" + url.replace( /^\/|\/$/g, "" ) + "/");
    qrs = (qrs || {});

    if ( get( "sitepassword" ) ) {
        qrs.password = get( "sitepassword" );
    }

    if ( qrs.format ) {
        delete qrs.format;
    }

    request({
        url: url,
        headers: getHeaders(),
        qs: qrs

    }, function ( error, response, html ) {
        if ( error ) {
            log( "ERROR - " + error );
        }

        // Errors first
        callback( error, {
            html: html,
            status: response.statusCode
        });
    });
},


/**
 *
 * @method getJson
 * @param {string} url Request url
 * @param {object} qrs Querystring mapping
 * @param {function} callback Fired when done
 * @public
 *
 */
getJson = function ( url, qrs, callback ) {
    url = (get( "siteurl" ) + "/" + url.replace( /^\/|\/$/g, "" ) + "/");
    qrs = (qrs || {});

    if ( get( "sitepassword" ) ) {
        qrs.password = get( "sitepassword" );
    }

    qrs.format = "json";

    request({
        url: url,
        json: true,
        headers: getHeaders(),
        qs: qrs

    }, function ( error, response, json ) {
        if ( error ) {
            log( "ERROR - " + error );
        }

        // Errors first
        callback( error, {
            json: json,
            status: response.statusCode
        });
    });
},


/**
 *
 * @method getJsonAndHtml
 * @param {string} url Request url
 * @param {object} qrs Querystring mapping
 * @param {function} callback Fired when done
 * @public
 *
 */
getJsonAndHtml = function ( url, qrs, callback ) {
    var res = {},
        errors = [];

    getJson( url, qrs, function ( error, json ) {
        if ( error ) {
            errors.push( error );
        }

        res.json = json;

        getHtml( url, qrs, function ( error, html ) {
            if ( error ) {
                errors.push( error );
            }

            res.html = html;

            callback( (errors.length ? errors : null), res );
        });
    });
},


/**
 *
 * @method getQuery
 * @param {object} data The hash of data a squarespace:query element supports
 * @param {object} qrs Querystring mapping hash
 * @param {function} callback Fired when done
 * @public
 *
 * @data {
 *      collection
 *      category
 *      tag
 *      featured
 *      limit
 * }
 *
 */
getQuery = function ( data, qrs, callback ) {
    var url = (get( "siteurl" ) + "/" + data.collection + "/");

    qrs = (qrs || {});

    if ( get( "sitepassword" ) ) {
        qrs.password = get( "sitepassword" );
    }

    qrs.format = "json";

    // Tag?
    if ( data.tag ) {
        qrs.tag = data.tag;
    }

    // Category?
    if ( data.category ) {
        qrs.category = data.category;
    }

    // Request?
    request({
        url: url,
        json: true,
        headers: getHeaders(),
        qs: qrs

    }, function ( error, response, json ) {
        if ( error ) {
            log( "ERROR - " + error );
        }

        var items = [];

        // Featured?
        if ( data.featured && json.items ) {
            for ( i = 0, len = json.items.length; i < len; i++ ) {
                if ( json.items[ i ].starred ) {
                    items.push( json.items[ i ] );
                }
            }

            json.items = items;
        }

        // Limit?
        if ( data.limit && json.items ) {
            json.items.splice( 0, (json.items.length - data.limit) );
        }

        // Errors first
        callback( error, json );
    });
},


/**
 *
 * @method getBlockJson
 * @param {string} blockId The block id
 * @param {function} callback Fired when done
 * @public
 *
 */
getBlockJson = function ( blockId, callback ) {
    request({
        url: (get( "siteurl" ) + API_GET_BLOCKFIELDS + blockId),
        json: true,
        headers: sqsLoginHeaders,
        qs: sqsUser

    }, function ( error, response, json ) {
        // Pass empty block as error
        if ( !json ) {
            json = { error: "Empty block JSON" };
        }

        // Error can come as result
        if ( error || json.error ) {
            error = (json.error ? json.error : error);

            log( "BLOCK ERROR - " + error );

            json = null;
        }

        // Errors first
        callback( error, json );
    });
},


/**
 *
 * @method getWidgetHtml
 * @param {object} blockJSON The block data object
 * @param {function} callback Fired when done
 * @public
 *
 */
getWidgetHtml = function ( blockJSON, callback ) {
    request({
        method: "POST",
        url: (get( "siteurl" ) + API_GET_WIDGETRENDERING),
        headers: sqsLoginHeaders,
        qs: {
            crumb: sqsLoginCrumb
        },
        form: {
            widgetJSON: JSON.stringify( blockJSON )
            //collectionId: ""
        }

    }, function ( error, response, string ) {
        var json = JSON.parse( string.replace( /\\uFFFD/g, "" ) );

        // Error can come as result
        if ( error || json.error ) {
            error = (json.error ? json.error : error);

            log( "WIDGET ERROR - " + error );

            json = null;
        }

        // Errors first
        callback( error, json );
    });
},


/******************************************************************************
 * @Private
*******************************************************************************/

log = function () {
    var args = [].slice.call( arguments, 0 );

    args.unshift( "> sqs-middleware:" );

    console.log.apply( console, args );
},


/**
 *
 * @method getHeaders
 * @param {object} headers Merge object with required headers
 * @returns {object}
 * @private
 *
 */
getHeaders = function ( headers ) {
    var ret = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.94 Safari/537.36"
    };

    if ( headers ) {
        ret = _.extend( ret, headers );
    }

    return ((get( "sandboxmode" ) && sqsLoginHeaders) ? sqsLoginHeaders : ret);
};


/******************************************************************************
 * @Export
*******************************************************************************/
module.exports = {
    // getter / setter for config
    set: set,
    get: get,

    // login for user
    doLogin: doLogin,

    // getter for requests
    getQuery: getQuery,
    getJson: getJson,
    getHtml: getHtml,
    getJsonAndHtml: getJsonAndHtml,
    getAPIData: getAPIData,
    getBlockJson: getBlockJson,
    getWidgetHtml: getWidgetHtml
};