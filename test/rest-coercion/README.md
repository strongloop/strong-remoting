# Test coercion of input arguments in REST adapter

The tests are grouped based on where the input argument is read from
and what is the content-type of that source.

After the tests finish, a CSV report is written in `report.csv`. This report
makes it easy to compare results between different strong-remoting versions,
just run `diff -du report1.csv report2.csv`.

## Query string

Arg spec: `{ arg: 'arg', http: { source: 'query' } }`

Example request:

```http
GET /api?arg=value&arg2=value2 HTTP/1.1
```

See `urlencoded-*.suite.js` for tests.

## URL-encoded form

Arg spec: `{ arg: 'arg', http: { source: 'form' } }`

Example request:

```http
POST /api HTTP/1.1
Content-Type: application/x-www-form-urlencoded

arg=value&arg2=value2
```

See `urlencoded-*.suite.js` for test cases.

## JSON-encoded form

Arg spec: `{ arg: 'arg', http: { source: 'form' } }`

Example request:

```http
POST /api HTTP/1.1
Content-Type: application/json

{
  "arg": "value",
  "arg2": "value2"
}
```

See `jsonform-*.suite.js` for test cases.

## JSON-encoded body

Arg spec: `{ arg: 'arg', http: { source: 'body' } }`

Example request:

```http
POST /api HTTP/1.1
Content-Type: application/json

{
  "name": "Superb",
  "maker": "Skoda"
}
```

See `jsonbody-*.suite.js` for test cases.

The difference between JSON form and body is that the argument is set to full
request body argument's http `source` is `body`.

## URL-encoded body

We don't have coverage for this scenario yet.

## URL path parameters

We don't have coverage for this scenario yet.
