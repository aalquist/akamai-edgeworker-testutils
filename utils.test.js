const mockSRQ_Response = require('./test_utils.js').mockSRQ_Response;
const mockSRQ_Response_Error = require('./test_utils.js').mockSRQ_Response_Error;
const EW_Mock_Factory  = require('./test_utils.js').EW_Mock_Factory;
const VariableCounter  = require('./test_utils.js').VariableCounter;
const mockCookieModule = require('./test_utils.js').mockCookieModule;
const streamToString  = require('./test_utils.js').streamToString;

import { httpRequest } from 'http-request';
import Request from "request";
import Response from "response";
import {Cookies} from 'cookies';

const factory = new EW_Mock_Factory({Request,Response});

describe('test suite - mockSRQ_Response', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('mockSRQ_Response', async () => {

    const initPMVars = {PM_USER_FOO : "bar", PM_USER_INFO : "data123",};
    const intReqHeaders = { 'header1' : 'header1-value', 'header2' : ['header2-value'] };
  
    var { requestMock} = factory.mockRequestFactory({ initPMVars, intReqHeaders });
    expect(requestMock.clientIp).toEqual("1.1.1.1");
    expect(requestMock.getHeader('header1')).toEqual(['header1-value']);
    expect(requestMock.getHeader('header2')).toEqual(['header2-value']);

    expect(requestMock.getVariable('PM_USER_FOO')).toEqual('bar');
    expect(requestMock.getVariable('PM_USER_INFO')).toEqual('data123');
    

  });

});

describe('test suite - mockSRQ_Response', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('mockSRQ_Response - text()', async () => {

    mockSRQ_Response({statuscode :200, response_headers: {"response_header" : "foo"}, responseText : "responseText"});
    const options = {"headers" : {}, "body": "body", "method": "GET", "timeout" : 1000 };
    
    const subReqResponse = await httpRequest("/some-path", options);
    expect(subReqResponse.ok).toEqual(true);
    expect(subReqResponse.status).toEqual(200);
    expect(await subReqResponse.text()).toEqual("responseText");
    expect(subReqResponse.getHeader("response_header")).toEqual(["foo"]);

    const response = await streamToString(subReqResponse.body);
    expect(response).toEqual("responseText");

  });

  test('mockSRQ_Response - json()', async () => {

    mockSRQ_Response({statuscode :200, response_headers: {"response_header" : "foo"}, responseText : "{}"});
    const options = {"headers" : {}, "body": "body", "method": "GET", "timeout" : 1000 };
    
    const subReqResponse = await httpRequest("/some-path", options);
    expect(subReqResponse.ok).toEqual(true);
    expect(subReqResponse.status).toEqual(200);
    expect(await subReqResponse.json()).toEqual({});
    expect(subReqResponse.getHeader("response_header")).toEqual(["foo"]);
    const response = await streamToString(subReqResponse.body);
    expect(response).toEqual("{}");

  });

  test('mockSRQ_Response - getHeaders() - 1', async () => {

    mockSRQ_Response({statuscode :200, response_headers: {"response_header" : "foo"}});
    const options = {"headers" : {}, "body": "body", "method": "GET", "timeout" : 1000 };
    
    const subReqResponse = await httpRequest("/some-path", options);
    expect(subReqResponse.ok).toEqual(true);
    expect(subReqResponse.status).toEqual(200);
    expect(subReqResponse.getHeaders()).toEqual({"response_header" : ["foo"] });

  });

  test('mockSRQ_Response - getHeaders() - 2', async () => {

    mockSRQ_Response({statuscode :200, response_headers: 
        {
          "response_header_1" : "foo1", 
          "response_header_2" : ["foo2"],
          "response_header_3" : ["foo3", "foo4"]
        }
      
      });
    const options = {"headers" : {}, "body": "body", "method": "GET", "timeout" : 1000 };
    
    const subReqResponse = await httpRequest("/some-path", options);
    expect(subReqResponse.ok).toEqual(true);
    expect(subReqResponse.status).toEqual(200);
    expect(subReqResponse.getHeaders()).toEqual({"response_header_1" : ["foo1"], "response_header_2" : ["foo2"], "response_header_3" : ["foo3", "foo4"] });

  });

  test('mockSRQ_Response', async () => {

    mockSRQ_Response();
    const options = {"headers" : {}, "body": "body", "method": "GET", "timeout" : 1000 };
    
    const subReqResponse = await httpRequest("/some-path", options);
    expect(subReqResponse.ok).toEqual(true);
    expect(subReqResponse.status).toEqual(200);
    expect(await subReqResponse.text()).toEqual(""); //default to empty string?
    expect(subReqResponse.getHeader("response_header")).toEqual(undefined);

    const response = await streamToString(subReqResponse.body);
    expect(response).toEqual("");

  });

  test('mockSRQ_Response_Error', async () => {

    mockSRQ_Response_Error({error_text : "error_text1"});
    await expect(async () => {
      await httpRequest("/some-path");
    }).rejects.toThrow("error_text1");

  });

  test('mockSRQ_Response_Error-default', async () => {

    mockSRQ_Response_Error();
    await expect(async () => {
      await httpRequest("/some-path");
    }).rejects.toThrow("mockSRQ_Response_Error");

  });

  test('mockCookieModule-init', async () => {

    const intReqHeaders = {};
    var { requestMock} = factory.mockRequestFactory({ intReqHeaders });
    mockCookieModule({'cookie1' : 'cookie1value'});

    var cookieJar = new Cookies(requestMock.getHeader('Cookie'));
    var cookieNames = cookieJar.names();
    expect(cookieNames).toEqual(['cookie1']);

  });
  
  test('mockCookieModule', async () => {

    const intReqHeaders = {'Cookie' : 'cookie1=cookie1value'};
    var { requestMock} = factory.mockRequestFactory({ intReqHeaders });
    mockCookieModule();

    var cookieJar = new Cookies(requestMock.getHeader('Cookie'));
    var cookieNames = cookieJar.names();
    expect(cookieNames).toEqual(['cookie1']);

  });

  test('mockRequestFactory json() - 1', async () => {

    const intReqHeaders = {};
    const initPMVars = {};

    const jsonbody = {};
    var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, jsonbody });
    const body = await requestMock.json();

    expect(body).toEqual({});

  });

  test('mockRequestFactory json() - 2', async () => {

    const intReqHeaders = {};
    const initPMVars = {};

    const jsonbody = '{}';
    var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, jsonbody });
    const body = await requestMock.json();

    expect(body).toEqual({});

  });

  test('mockRequestFactory json() - 3', async () => {

    const intReqHeaders = {};
    const initPMVars = {};

    const jsonbody = null;
    var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, jsonbody });
    const body = await requestMock.json();

    expect(body).toEqual(undefined);

  });

  test('mockRequestFactory json() - 4', async () => {

    const intReqHeaders = {};
    const initPMVars = {};

    const jsonbody = undefined;
    var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, jsonbody });
    const body = await requestMock.json();

    expect(body).toEqual(undefined);

  });

  test('mockRequestFactory json() - 5 error', async () => {

    async function throwErrorAsync() {
      const intReqHeaders = {};
      const initPMVars = {};

      const jsonbody = "xyz";
      var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, jsonbody });
      const body = await requestMock.json();
    }

    await expect(throwErrorAsync()).rejects.toThrow("Unexpected token 's', \"xyz\" is not valid JSON");
    

  });

  test('mockRequestFactory text() - 1', async () => {

    const intReqHeaders = {};
    const initPMVars = {};

    const textbody = "sometext";
    var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, textbody });
    const body = await requestMock.text();

    expect(body).toEqual("sometext");

  });

  



});

describe('VariableCounter Test Suite', () => {

  test("Test 1", () => {
      
      function setVariable(key, value){
          expect(key).toEqual(value);
      }

      var vCounter = new VariableCounter();
      expect(vCounter.getCount() ).toEqual(0);

      vCounter.setVariable("foo", "foo");
      expect(vCounter.getCount() ).toEqual(6);
      expect(vCounter.getCurrentMapCharCount()).toEqual(6);

      vCounter.setVariable("bar", "bar");
      expect(vCounter.getCount() ).toEqual(12);
      expect(vCounter.getCurrentMapCharCount()).toEqual(12);

      vCounter.reset();
      expect(vCounter.getCount()).toEqual(0);
      expect(vCounter.getCurrentMapCharCount()).toEqual(0);

      

  });

  test("Test 2", () => {

      function setVariable(key, value){
          expect(key).toEqual(value);
      }

      var vCounter = new VariableCounter();
      expect(vCounter.getCount() ).toEqual(0);

      for (let i = 1; i < 1030; i++) {
          vCounter.setVariable("a", "a");
          expect(vCounter.getCount() ).toEqual(i * 2);
          expect(vCounter.getCurrentMapCharCount()).toEqual(2);
      }

  });

  test("Test 3", () => {

      var _key, _value;
      function setVariable(key, value){
          _key = key;
          _value = value;
      }

      var vCounter = new VariableCounter();
      expect(vCounter.getCount() ).toEqual(0);

      for (let i = 1; i < 103; i++) {
          let num = i.toString().padStart(4, '0');

          vCounter.setVariable(`a${num}`, `a${num}`);
          expect(_key).toEqual(_value);

          if( i == 10){
              expect(vCounter.getCurrentMapCharCount()).toEqual(i * 10);

          } else {
              expect(vCounter.getCurrentMapCharCount()).toEqual(i * 10);

          }
          
      }

      expect(vCounter.getCurrentMapCharCount()).toEqual(102 * 10);
      vCounter.setVariable(`_12`, `1`);
      expect(vCounter.getCurrentMapCharCount()).toEqual(1024);

      try {
          vCounter.setVariable("1", "");
      } catch (error) {
          expect(error.message).toBe("Optimistic usage violation detected and above setVariable limit of 1024");
      }
      expect(() => vCounter.setVariable("1", "") ).toThrow("Optimistic usage violation detected and above setVariable limit of 1024");


  });

  test("Test 4", () => {

      var _key, _value;
      function setVariable(key, value){
          _key = key;
          _value = value;
      }

      var vCounter = new VariableCounter();
      expect(vCounter.getCount() ).toEqual(0);

      let variable_key = 'PMUSER_VARIABLE_NAME_TOO_LONG_0000'
      try {
          vCounter.setVariable(variable_key, "");
      } catch (error) {
          expect(error.message).toBe("PMUSER variable length is greater than 32 characters");
      }
      
      expect(() => vCounter.setVariable(variable_key, "") ).toThrow("PMUSER variable length is greater than 32 characters");

  });
});

