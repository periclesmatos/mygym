FROM node:26-alpine AS frontend
WORKDIR /front
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Lint, formatação e testes falham o build antes de gerar o front.
RUN npm run lint && npm run format:check && npm test
RUN npm run build

FROM maven:3.9-eclipse-temurin-25 AS backend
WORKDIR /app
COPY backend/pom.xml .
COPY backend/.mvn ./.mvn
COPY backend/src ./src
COPY --from=frontend /front/dist ./src/main/resources/static
RUN mvn -q -DskipTests package

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=backend /app/target/appgym.jar /app/appgym.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/appgym.jar"]
