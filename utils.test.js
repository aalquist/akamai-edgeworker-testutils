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

    requestMock.removeHeader('header2');
    expect(requestMock.removeHeader('header2')).toBeUndefined();
    expect(requestMock.getHeader('header1')).toEqual(['header1-value']);

    expect(requestMock.getVariable('PM_USER_FOO')).toEqual('bar');
    expect(requestMock.getVariable('PM_USER_INFO')).toEqual('data123');
    

  });

});

describe('test suite', () => {

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
  
  test('mockCookieModule - upper from lower', async () => {

    const intReqHeaders = {'Cookie' : 'cookie1=cookie1value'};
    var { requestMock} = factory.mockRequestFactory({ intReqHeaders });
    mockCookieModule();

    expect( new Cookies(requestMock.getHeader('Cookie')).names() ).toEqual(['cookie1']);
    expect( new Cookies(requestMock.getHeader('cookie')).names() ).toEqual(['cookie1']);

  });

  test('mockCookieModule - both upper&lower from upper', async () => {

    const intReqHeaders = {'Cookie' : 'Cookie1=cookie1value'};
    var { requestMock} = factory.mockRequestFactory({ intReqHeaders });
    mockCookieModule();

    expect( new Cookies(requestMock.getHeader('cookie')).names() ).toEqual(['Cookie1']);
    expect( new Cookies(requestMock.getHeader('Cookie')).names() ).toEqual(['Cookie1']);

  });

  test('mockRequestFactory json() - 1', async () => {

    const intReqHeaders = {};
    const initPMVars = {};

    const requestBody = '{}';
    var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, requestBody });
    const body = await requestMock.json();

    expect(body).toEqual({});

  });

  test('mockRequestFactory json() - 2', async () => {

    const intReqHeaders = {};
    const initPMVars = {};

    const requestBody = null;
    var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, requestBody });
    const body = await requestMock.json();

    expect(body).toEqual(undefined);

  });

  test('mockRequestFactory json() - 3', async () => {

    const intReqHeaders = {};
    const initPMVars = {};

    const requestBody = undefined;
    var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, requestBody });
    const body = await requestMock.json();

    expect(body).toEqual(undefined);

  });

  test('mockRequestFactory json() - 4 error', async () => {

    async function throwErrorAsync() {
      const intReqHeaders = {};
      const initPMVars = {};

      const requestBody = "xyz";
      var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, requestBody });
      const body = await requestMock.json();
    }

    await expect(throwErrorAsync()).rejects.toThrow("Unexpected token 'x', \"xyz\" is not valid JSON");
    

  });

  test('mockRequestFactory text() - 5', async () => {

    const intReqHeaders = {};
    const initPMVars = {};

    const requestBody = "sometext";
    var { requestMock } = factory.mockRequestFactory({ initPMVars, intReqHeaders, requestBody });
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

  test("Test 3 - error - default 1024", () => {

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

  test("Test 3 - no error - 3500 max", () => {

      var _key, _value;
      function setVariable(key, value){
          _key = key;
          _value = value;
      }

      var vCounter = new VariableCounter( {max_chars:3500});
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
      expect(() => vCounter.setVariable("1", "") ).not.toThrow("Optimistic usage violation detected and above setVariable limit of 1024");


  });

  test("Test 3 - error - 3500 max", () => {

      const max_chars = 3500;
      var vCounter = new VariableCounter( {max_chars});
      expect(vCounter.getCount() ).toEqual(0);

      const setVariableAttempts = 3500 / 10;

      for (let i = 1; i < (setVariableAttempts + 1); i++) {
          let num = i.toString().padStart(4, '0');

          vCounter.setVariable(`a${num}`, `a${num}`);
          expect(vCounter.getCurrentMapCharCount()).toEqual(i * 10);

      }

      expect(vCounter.getCurrentMapCharCount()).toEqual(setVariableAttempts * 10);
      
      try {
          vCounter.setVariable("1", "");
      } catch (error) {
          expect(error.message).toBe(`Optimistic usage violation detected and above setVariable limit of ${max_chars}`);
      }
      expect(() => vCounter.setVariable("1", "") ).toThrow(`Optimistic usage violation detected and above setVariable limit of ${max_chars}`);


  });

  test("Test 3 - error - 3500 max w/ mockRequestFactory", () => {

      const max_chars = 3500;
      const factory = new EW_Mock_Factory({Request,Response});
      const { requestMock, pmVarCounter : vCounter } = factory.mockRequestFactory({ max_chars });

      expect(vCounter.count ).toEqual(0);

      const setVariableAttempts = 3500 / 10;

      for (let i = 1; i < (setVariableAttempts + 1); i++) {
          let num = i.toString().padStart(4, '0');
          requestMock.setVariable(`a${num}`, `a${num}`);
          expect(vCounter.count).toEqual(i * 10);
      }

      expect(vCounter.count).toEqual(setVariableAttempts * 10);
      
      try {
          requestMock.setVariable("1", "");
      } catch (error) {
          expect(error.message).toBe(`Optimistic usage violation detected and above setVariable limit of ${max_chars}`);
      }
      expect(() => requestMock.setVariable("1", "") ).toThrow(`Optimistic usage violation detected and above setVariable limit of ${max_chars}`);

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

  test('responseMock.getHeader() - single header', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      responseMock.setHeader('Content-Type', 'application/json');
      expect(responseMock.getHeader('Content-Type')).toEqual('application/json');
  });

  test('responseMock.getHeader() - case insensitive', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      responseMock.setHeader('content-type', 'application/json');
      expect(responseMock.getHeader('CONTENT-TYPE')).toEqual('application/json');
      expect(responseMock.getHeader('Content-Type')).toEqual('application/json');
  });

  test('responseMock.getHeader() - non-existent header', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      expect(responseMock.getHeader('Non-Existent')).toBeUndefined();
  });

  test('responseMock.setHeader() - replaces existing header', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      responseMock.setHeader('X-Custom', 'value1');
      expect(responseMock.getHeader('X-Custom')).toEqual('value1');
      
      responseMock.setHeader('X-Custom', 'value2');
      expect(responseMock.getHeader('X-Custom')).toEqual('value2');
  });

  test('responseMock.addHeader() - add single header', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      responseMock.addHeader('Set-Cookie', 'session=abc123');
      expect(responseMock.getHeader('Set-Cookie')).toEqual('session=abc123');
  });

  test('responseMock.addHeader() - add multiple values to same header', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      responseMock.addHeader('Set-Cookie', 'session=abc123');
      responseMock.addHeader('Set-Cookie', 'token=xyz789');
      
      const cookies = responseMock.getHeader('Set-Cookie');
      expect(Array.isArray(cookies)).toEqual(true);
      expect(cookies).toEqual(['session=abc123', 'token=xyz789']);
  });

  test('responseMock.addHeader() - case insensitive', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      responseMock.addHeader('set-cookie', 'session=abc123');
      responseMock.addHeader('SET-COOKIE', 'token=xyz789');
      
      const cookies = responseMock.getHeader('Set-Cookie');
      expect(Array.isArray(cookies)).toEqual(true);
      expect(cookies).toEqual(['session=abc123', 'token=xyz789']);
  });

  test('responseMock.removeHeader() - removes existing header', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      responseMock.setHeader('X-Custom', 'value');
      expect(responseMock.getHeader('X-Custom')).toEqual('value');
      
      responseMock.removeHeader('X-Custom');
      expect(responseMock.getHeader('X-Custom')).toBeUndefined();
  });

  test('responseMock.removeHeader() - case insensitive', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      responseMock.setHeader('content-type', 'application/json');
      responseMock.removeHeader('CONTENT-TYPE');
      expect(responseMock.getHeader('content-type')).toBeUndefined();
  });

  test('responseMock.getHeaders() - returns all headers', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      responseMock.setHeader('Content-Type', 'application/json');
      responseMock.setHeader('X-Custom', 'custom-value');
      
      const headers = responseMock.getHeaders();
      expect(headers['content-type']).toEqual('application/json');
      expect(headers['x-custom']).toEqual('custom-value');
  });

  test('responseMock.getHeaders() - includes multiple header values', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      responseMock.addHeader('Set-Cookie', 'session=abc123');
      responseMock.addHeader('Set-Cookie', 'token=xyz789');
      responseMock.setHeader('Content-Type', 'text/plain');
      
      const headers = responseMock.getHeaders();
      expect(Array.isArray(headers['set-cookie'])).toEqual(true);
      expect(headers['set-cookie']).toEqual(['session=abc123', 'token=xyz789']);
      expect(headers['content-type']).toEqual('text/plain');
  });

  test('responseMock.getHeaders() - empty when no headers set', () => {
      var { responseMock } = factory.mockRequestFactory({});
      
      const headers = responseMock.getHeaders();
      expect(headers).toEqual({});
  });
});

