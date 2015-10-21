/*!
 *
 * Squarespace Middleware.
 *
 */
var _ = require( "underscore" ),
    request = require( "request" ),
    cookieParser = require( "cookie" ),
    sqsLogger = require( "node-squarespace-logger" ),

    API_AUTH_LOGIN = "/api/auth/Login/",
    API_GET_SITELAYOUT = "/api/commondata/GetSiteLayout/",
    API_GET_COLLECTIONS = "/api/commondata/GetCollections/",
    API_GET_BLOCKFIELDS = "/api/block-fields/",
    API_GET_WIDGETRENDERING = "/api/widget/GetWidgetRendering/",
    //API_GET_TEMPLATETWEAKSETTINGS = "/api/template/GetTemplateTweakSettings/",
    //api/template/GetTemplate?templateId=
    //api/commondata/GetCollection?collectionId=
    //api/page-collection-data/collectionId=
    //api/templates/:templateId

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
    // If the user left a trailing slash on the siteurl, remove it.
    if (key === 'siteurl' && val.charAt(val.length - 1) === '/') {
      val = val.replace(/\/$/, '');
    }

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
 * @method getCrumb
 * @public
 *
 */
getCrumb = function () {
    return sqsLoginCrumb;
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
        // Error can come as result
        if ( error || json.error ) {
            error = (json.error ? json.error : error);

            sqsLogger.log( "error", ("Error posting to Squarespace login with middleware => " + error) );

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
                sqsLogger.log( "error", ("Error requesting secure login token from Squarespace with middleware => " + error) );

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
            {
                key: "siteLayout",
                url: (get( "siteurl" ) + API_GET_SITELAYOUT)
            },
            {
                key: "collections",
                url: (get( "siteurl" ) + API_GET_COLLECTIONS)
            }
        ],
        data = {},
        errors = [];

    function getAPI() {
        var api = apis.shift();

        request({
            url: api.url,
            json: true,
            headers: sqsLoginHeaders,
            qs: sqsUser

        }, function ( error, response, json ) {
            // Error can come as result
            if ( error || json.error ) {
                error = (json.error ? json.error : error);

                sqsLogger.log( "error", ("Error fetching API data from Squarespace with middleware => " + error) );

                errors.push( error );
            }

            // Store API data for callback
            data[ api.key ] = json;

            // All done, pass the API data to callback
            if ( !apis.length ) {
                // Errors first
                callback( (errors.length ? errors : null), data );

            } else {
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
    url = [get( "siteurl" ), url.replace( /^\/|\/$/g, "" )].join( "/" );
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
            sqsLogger.log( "error", ("Error requesting page html from Squarespace with middleware => " + error) );
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
    url = [get( "siteurl" ), url.replace( /^\/|\/$/g, "" )].join( "/" );
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
        // Error can come as result
        if ( error || json.error ) {
            error = (json.error ? json.error : error);

            sqsLogger.log( "error", ("Error requesting page json from Squarespace with middleware => " + error) );
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
        // Error can come as result
        if ( error || json.error ) {
            error = (json.error ? json.error : error);

            sqsLogger.log( "error", ("Error requesting Squarespace:query with middleware => " + error) );
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

            sqsLogger.log( "error", ("Error requesting block json from Squarespace with middleware => " + error) );

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

            sqsLogger.log( "error", ("Error requesting widget html from Squarespace with middleware => " + error) );

            json = null;
        }

        // Errors first
        callback( error, json );
    });
},


/******************************************************************************
 * @Private
*******************************************************************************/

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
    getCrumb: getCrumb,
    getQuery: getQuery,
    getJson: getJson,
    getHtml: getHtml,
    getJsonAndHtml: getJsonAndHtml,
    getAPIData: getAPIData,
    getBlockJson: getBlockJson,
    getWidgetHtml: getWidgetHtml
};
