uwsgi --plugin python,http --http 0.0.0.0:8000 --wsgi-file wsgi/application.py --check-static . --static-index index.html --static-safe "$(realpath ..)" --touch-reload=wsgi/application.py
