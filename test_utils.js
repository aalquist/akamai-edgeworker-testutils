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

    mockRequestFactory(initPMVars = {}, intReqHeaders = {}, jsonbody ){

        const pmVarCounter = new VariableCounter();
        let wasTerminatedCount = 0;
    
        let PM_Vars = new Map();
        Object.keys(initPMVars).forEach( k => { PM_Vars.set(k, initPMVars[k]); } );
        
        let reqHeaders = new Map();
        Object.keys(intReqHeaders).forEach( k => { reqHeaders.set(k, intReqHeaders[k]); } );
    
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
                return Promise.resolve(jsonbody);
            });
    
        }
       
    
        return { requestMock : requestMock, responseMock: responseMock, PM_Vars: PM_Vars, reqHeaders: reqHeaders, pmVarCounter:pmVarCounter };
      
    }

}


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

    return {mockEKVResponse:mockEKVResponse, httpRequestModule: httpRequestModule};
}


export function mockSRQ_Response(statuscode=200, response_headers={}, responseText=null, url=null){

    var mockSRQResponse = (arg) =>{
        return {
          url: url,
          status: statuscode,
          ok: statuscode === 200,
          headers: response_headers,
          getHeader: (arg) => {
            const headers = response_headers[arg];
            if (!headers) {
                return undefined; // Return undefined if doesn't exist: https://techdocs.akamai.com/edgeworkers/docs/http-request#getheader
            }
            // If headers exist, ensure the return value is an array of strings
            // This is for demonstration; adjust based on your actual header storage format
            return Array.isArray(headers) ? headers : [headers];
          },
          text: jest.fn( () => {return responseText; })
        };
      };
    
    var httpRequestModule = require("http-request");
    httpRequestModule.httpRequest = jest.fn().mockImplementation(mockSRQResponse);
    return {mockSRQResponse:mockSRQResponse, httpRequestModule: httpRequestModule};
}

export function mockSRQ_Response_Error(error_text){

    var mockSRQResponseErr = (arg) =>{
        throw new Error(error_text)
    };
    
    var httpRequestModule = require("http-request");
    httpRequestModule.httpRequest = jest.fn().mockImplementation(mockSRQResponseErr);
    return {mockSRQResponseErr:mockSRQResponseErr, httpRequestModule: httpRequestModule};
}

export function mockCookieModule(initCookies={}){
    let cookieJar = new Map();
    Object.keys(initCookies).forEach( k => { cookieJar.set(k, initCookies[k]); } );
   

    var mockCookies = (arg) =>{
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

    return {cookieModule:cookieModule};
}
