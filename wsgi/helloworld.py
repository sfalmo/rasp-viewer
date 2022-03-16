def application(environ, start_response):
    status = '200 OK'
    output = 'Hello World!'
    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)
    output = bytes(str(environ), encoding='utf-8')
    return [output]
