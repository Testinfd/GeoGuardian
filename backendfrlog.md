JATIN@JATIN-PC MINGW64 /d/codes/Hackthon_Projects/GeoGuardian/backend (main)

$ uvicorn app.main:app --reload

INFO: Will watch for changes in these directories: ['D:\\codes\\Hackthon_Projects\\GeoGuardian\\backend']

INFO: Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)

INFO: Started reloader process [29304] using WatchFile:

Process SpawnProcess-1:

Traceback (most recent call last): File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\multiprocessing\process.py", line 314, in_bootstrap self.run()

File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\multiprocessing\process.py", line 108, in rui self._target(*self._args, **self._kwargs) File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\site-packages\uvicorn\_subprocess.py", line 80, in subprocess_start arget(sockets=sockets)

target(sockets=sockets) File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\site-packages\uvicorn\server.py", line 67, in run return asyncio_run(self.serve(sockets=sockets), loop factory=self.config.get_loop factory()) File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\site-packages\uvicorn\_compat.py", line 53, in asyncio_run return loop.run until_complete(main) File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\asyncio\base_events.py", line 649, in run_until_complete

eturn future.result() File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\site-packages\uvicorn\server.py", lin await self. serve(sockets) File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\site-packages\uvicorn\server.py", line 7 serve

config.load()

File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\site-packages\uvicorn\config.py", line 438, in load self.loaded_app = import_from_string(self.app)

File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\sit

module = importlib.import_module(module_str)

File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\importlib\_init_.py", line 126, in import_module

return bootstrap. gcd import(name[level:1, package, level)

File "<frozen importlib. bootstrap>", line 1050, in gcd_imp(

File "<frozen importlib._bootstrap>", line 1027, in _find_and_load

File "<frozen importlib. bootstrap>", line 1006, in find and load unlocked

File "<frozen importlib. bootstrap>", line 688, in load unlocked

File "<frozen importlib._bootstrap_external>", line 883, in exec_module

File "<frozen importlib. bootstrap>", line 241, in call with frames removed

File "D:\codes\Hackthon_Projects\GeoGuardian\backend\app\main.py", line 7, in <module>

from .core.config import settings

File "D:\codes\Hackthon_Projects\GeoGuardian\backend\app\core\config.py", line 53, in <module>

settings = Settings()

File "C:\Users\JATIN\AppData\Local\Programs\Python\Python310\lib\site-packages\pydantic_settings\main.py", line 193, in _init

super().init(

File "C: \Users\JATIN\AppData\Local\Programs\Python\Python310\lib\site-packages\pydantic\main.py", line 253, in_init validated self = self. pydantic validator .validate python(data, self instance=self) self = self. pydantic_validator .vali pvdantic core. pvdantic core.ValidationError: 2 validation errors for Settines