# Build from repository root:
#   docker build -t workflow-builder-backend:latest -f backend-java/Dockerfile ./backend-java

FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /build
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl \
    && addgroup -S spring && adduser -S spring -G spring
COPY --from=builder /build/build/libs/*.jar app.jar
USER spring:spring
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -sf http://127.0.0.1:8000/health > /dev/null || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
