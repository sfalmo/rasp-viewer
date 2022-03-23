# Scripts for dynamic server-side processing

In its basic functionality, the rasp-viewer displays output of RASP runs as overlays on a map.
These overlays, the so-called BLIPMAPS, are pregenerated and can be accessed without any server-side processing - the server merely has to provide the corresponding BLIPMAP files.

However, users may wish to interact more dynamically with the 3D output of RASP, for example by inspecting crosssections or soundings at arbitrary locations within the forecast domain.
For this, the server has to generate the relevant data ad hoc and send it to the user.
A common way of doing this in the early days was the use of CGI scripts.
This technique is now discouraged and the Web Server Gateway Interface (WSGI) came up as a modern alternative.

WSGI defines an interface over which a web server (e.g. Apache) can call executables (e.g. Python scripts) and consume their output.
`helloworld.py` is a simple example of such a WSGI conforming Python script.

To use this feature, enable WSGI in your web server and configure their URL end points.
For Apache, add this to the VirtualHost section of your domain:

```
<VirtualHost your.domain:443>
    ...
    WSGIScriptAlias /rasp-viewer/sounding /path/to/rasp-viewer/wsgi/sounding.py
    WSGIScriptAlias /rasp-viewer/crosssection /path/to/rasp-viewer/wsgi/crosssection.py
    WSGIApplicationGroup %{GLOBAL}
</VirtualHost>
```

Use `helloworld.py` to test your web server configuration.
