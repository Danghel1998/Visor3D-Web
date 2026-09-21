"""
Servidor local ultraligero para Visor3D
Ejecuta el servidor web y abre automáticamente el visor 3D en el navegador predeterminado.
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8110


def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            super().end_headers()

    Handler = NoCacheHandler
    Handler.extensions_map.update({
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.html': 'text/html',
    })

    for p in range(PORT, PORT + 20):
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                print("=======================================================")
                print("  Visor3D - Residencia Estudiantil I.E. 16722 (Bagua)")
                print(f"  URL Local: http://localhost:{p}")
                print("=======================================================")
                webbrowser.open(f"http://localhost:{p}")
                print("Presione Ctrl+C para detener el servidor.")
                try:
                    httpd.serve_forever()
                except KeyboardInterrupt:
                    print("\nServidor detenido.")
                return
        except OSError:
            continue
    print("No se encontró un puerto libre.")


if __name__ == "__main__":
    run_server()
