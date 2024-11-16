import { Readable } from 'stream';

export class VariableCounter {
    constructor(config = {}){
        this.count = 0;
        this.mostCautious = config.mostCautious || false;
        this.PM_Vars = new Map();
    }

    setVariable(key,value){
        
        var add = key.length + key.length;
        this.count = this.count + add;

        if(this.mostCautious && this.count > 1024){
            throw new Error("Cautious usage violation detected and above setVariable limit of 1024");

        } else {

            var charCount = this.getCurrentMapCharCount();
            var newLength = key.length + (value + "").length;

            if( newLength + charCount <= 1024){
                this.PM_Vars.set(key, value);
            } else {
                throw new Error("Optimistic usage violation detected and above setVariable limit of 1024");
            }
        }

        if (key.length > 32)
            throw new Error("PMUSER variable length is greater than 32 characters")

        return {key:key, value:value};
    }

    reset(){
        this.count = 0;
        this.PM_Vars.clear();
    }

    getCount(){
        return this.count;
    }

    getCurrentMapCharCount(){
        let localCount = 0;

        Array.from(this.PM_Vars, ([key, value]) => {
            localCount = localCount + key.length;
            localCount = localCount + (value +"").length;
        });

        return localCount;
    }
    
}

export class EW_Mock_Factory {

    constructor({Request, Response}){
        this.RequestClass = Request;
        this.ResponseClass = Response;
    }

    mockRequestFactory({initPMVars={}, intReqHeaders={}, jsonbody, textbody} = {} ){
        
        mockSetCookieModule();

        const pmVarCounter = new VariableCounter();
        let wasTerminatedCount = 0;
    
        let PM_Vars = new Map();
        Object.keys(initPMVars).forEach( k => { PM_Vars.set(k, initPMVars[k]); } );
        
        let reqHeaders = new Map();
        Object.keys(intReqHeaders).forEach( k => { 
            if( typeof intReqHeaders[k] == "string" ){ //it should be an array but usefull for most header use cases
                reqHeaders.set(k, [intReqHeaders[k] ]); 
            } else {
                reqHeaders.set(k, intReqHeaders[k]); 
            }
        } );
    
        let requestMock = new this.RequestClass();
        let responseMock = new this.ResponseClass();

        requestMock.getVariable = jest.fn( (arg) => {
            const returnThis =  PM_Vars.get(arg);
            return returnThis;
        });
      
        requestMock.setVariable = jest.fn((arg, val) => {
            pmVarCounter.setVariable(arg, val);
            PM_Vars.set(arg, val);
        });
      
        requestMock.getHeader = jest.fn((arg) => {
            const returnThis =  reqHeaders.get(arg);
            return returnThis;
        });
      
        requestMock.setHeader = jest.fn((arg, val) => {
            reqHeaders.set(arg, val);
        });
    
        requestMock.getHeaders = jest.fn(() => {
            const reqHeadersObj = Array.from(reqHeaders).reduce((acc, [key, value]) => {
                acc[key.toLowerCase()] = value;
                return acc;
              }, {});
            return reqHeadersObj;
        });
    
        requestMock.respondWith = jest.fn((arg1, arg2, arg3, arg4) => {
            wasTerminatedCount = wasTerminatedCount + 1;
        });
    
        requestMock.wasTerminated = jest.fn(() => {
           return wasTerminatedCount > 0;
        });
    
        if (jsonbody){
            requestMock.json = jest.fn(() => {

                const resolveThis = typeof jsonbody === "string" ? JSON.parse(jsonbody) : jsonbody;

                return Promise.resolve(resolveThis);
            });
        }

        if (textbody){
            requestMock.text = jest.fn(() => {
                return Promise.resolve(textbody);
            });
        }
       
        return { requestMock, responseMock, PM_Vars, reqHeaders, pmVarCounter };
      
    }

}

//deprecated
export function mockEKV_Response(statuscode=200, response_headers={}, responseText=null){
    var mockEKVResponse = (arg) =>{
        return {
          status: statuscode,
          ok: statuscode === 200,
          headers: response_headers,
          getHeader: (arg) => {
            if( arg === "Content-Length" ){
              var length = responseText ? responseText.length + "" : 0;
              return length;
            } else {
                return arg in response_headers ? response_headers[arg] : undefined;
            }
          },
          text: jest.fn( () => {return responseText; })
        };
      };
    
    var httpRequestModule = require("http-request");
    httpRequestModule.httpRequest = jest.fn().mockImplementation(mockEKVResponse);

    return {mockEKVResponse, httpRequestModule};
}

export async function streamToString(stream){

    const bodyArray = [];

    await stream.getReader().read().then(({ done, value }) => {
        if (!done) {
          bodyArray.push(value);
        }
    });

    const returnThis = bodyArray.join("");
    return returnThis;
    
}

export function mockSRQ_Response({statuscode, response_headers, responseText}  = {}){

    var statuscode = statuscode || 200;
    var response_headers = response_headers || {};
    var responseText = responseText || "";

    const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(responseText);
          controller.close();
        }
    });

    var mockSRQResponse = (arg) =>{

        return {
          body: readableStream,
          status: statuscode,
          ok: statuscode === 200,
          getHeaders: () => {
            const result = {};
            for (const key in response_headers) {
                if (response_headers.hasOwnProperty(key)) {
                    result[key] = Array.isArray(response_headers[key]) ? response_headers[key] : [response_headers[key]];
                }
            }
            return result;
          },
          getHeader: (arg) => {
            const headers = response_headers[arg];
            if (!headers) {
                return undefined; // Return undefined if doesn't exist: https://techdocs.akamai.com/edgeworkers/docs/http-request#getheader
            }
            // If headers exist, ensure the return value is an array of strings
            // This is for demonstration; adjust based on your actual header storage format
            return Array.isArray(headers) ? headers : [headers];
          },
          text: jest.fn( async () => responseText ),
          json: jest.fn( async () => JSON.parse(responseText) )
        };
      };
    
    var httpRequestModule = require("http-request");
    httpRequestModule.httpRequest = jest.fn().mockImplementation(mockSRQResponse);
    return {mockSRQResponse, httpRequestModule};
}

export function mockSRQ_Response_Error({error_text} = {}){

    var error_text = error_text || "mockSRQ_Response_Error";

    var mockSRQResponseErr = (arg) =>{
        throw new Error(error_text)
    };
    
    var httpRequestModule = require("http-request");
    httpRequestModule.httpRequest = jest.fn().mockImplementation(mockSRQResponseErr);
    return {mockSRQResponseErr, httpRequestModule};
}

export function mockSetCookieModule(){
    
    let _cookieString = undefined;

    var mockSetCookies = (cookieString) =>{
        _cookieString = cookieString;
        
        return {
            name: undefined,
            value: undefined,
            maxAge: undefined,
            domain: undefined,
            path: undefined,
            expires: undefined,
            httpOnly: false,
            secure: false,
            sameSite: undefined,
            toHeader: jest.fn(()=> _cookieString ),
        };

      };
    
    var cookieModule = require("cookies");
    cookieModule.SetCookie = jest.fn().mockImplementation(mockSetCookies);

    return {cookieModule};
}

export function mockCookieModule(initCookies={}){
    let cookieJar = new Map();
    Object.keys(initCookies).forEach( k => { cookieJar.set(k, initCookies[k]); } );
   
    var mockCookies = (cookieArray) =>{

        if(cookieArray){
            for (const cookieString of cookieArray){
                const _cookies = cookieString && cookieString?.length > 0 ? cookieString.split(';') : [];
                _cookies.forEach(cookie => {
                    const [key, value] = cookie.split('=').map(c => c.trim());
                    cookieJar.set(key, value);
                });
            }
        }

        return {
            toHeader: jest.fn(),
            get: jest.fn(),
            getAll: jest.fn(),
            names: jest.fn( () => {return Array.from(cookieJar.keys()); }),
            add: jest.fn(),
            delete: jest.fn(),
        };
      };
    
    var cookieModule = require("cookies");
    cookieModule.Cookies = jest.fn().mockImplementation(mockCookies);

    return {cookieModule};
}
