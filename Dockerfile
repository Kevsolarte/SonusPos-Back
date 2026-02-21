# 1. Usamos una imagen de Node.js ligera (Alpine es muy eficiente)
FROM node:20-alpine

# 2. Creamos el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos los archivos de dependencias primero para aprovechar el caché de Docker
COPY package*.json ./
COPY prisma ./prisma/

# 4. Instalamos las dependencias
RUN npm install

# 5. Copiamos el resto del código fuente
COPY . .

# 6. Generamos el cliente de Prisma (vital para que funcione la BD)
RUN npx prisma generate

# 7. Compilamos el proyecto (TypeScript -> JS)
RUN npm run build

# 8. Exponemos el puerto en el que corre tu app (según tu app.ts)
EXPOSE 3000

# 9. Comando para arrancar la app
CMD ["npm", "start"]
