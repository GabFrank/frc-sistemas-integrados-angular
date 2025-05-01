Pasos para implementar el backup:

Adicionar los siguientes datos en application.properties
backup.local-path=/Users/gabfranck/Downloads //local fisico en donde va a ser creado el backup, puede ser en FRC/backup/
backup.google-drive.folder-id=1w6PxstdR46f1fo-Yr9yCy2fq1_r9Rexb //id de la carpeta en google drive, el id esta en la url

los datos del id de client y llave secreta estan el este link:
https://console.cloud.google.com/auth/clients/170136643206-fvllppiiipn2cbgfoebcdfcoge4mlala.apps.googleusercontent.com?hl=es-419&inv=1&invt=AbwPsA&project=bodega-franco-frc

el id del forlder de google drive esta en la url de cada carpeta:
https://drive.google.com/drive/folders/{id}

Al iniciar el servidor, ingresar al navegador web en donde esta el servidor el siguiente link:
http://localhost:8082/auth/google/force-init

en el log del servidor va a aparecer un link en donde tenemos que acceder estando logeado como frcsistemasinformaticos@gmail.com en google, ejemplo:
 https://accounts.google.com/o/oauth2/auth?access_type=offline&client_id=170136643206-fvllppiiipn2cbgfoebcdfcoge4mlala.apps.googleusercontent.com&redirect_uri=http://localhost:8888/Callback&response_type=code&scope=https://www.googleapis.com/auth/drive.file