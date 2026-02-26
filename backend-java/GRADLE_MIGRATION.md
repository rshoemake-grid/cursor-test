# Maven to Gradle Migration

This project has been converted from Maven to Gradle build system.

## Changes Made

### Removed
- ❌ `pom.xml` - Maven build file

### Added
- ✅ `build.gradle` - Gradle build file
- ✅ `settings.gradle` - Gradle settings
- ✅ `gradle.properties` - Gradle properties
- ✅ `gradlew` - Gradle wrapper script (Unix/Mac)
- ✅ `gradlew.bat` - Gradle wrapper script (Windows)
- ✅ `gradle/wrapper/gradle-wrapper.properties` - Gradle wrapper configuration

## Build Commands

### Maven (Old)
```bash
mvn clean install          # Build
mvn spring-boot:run        # Run
mvn test                   # Test
```

### Gradle (New)
```bash
./gradlew clean build      # Build
./gradlew bootRun          # Run
./gradlew test             # Test
./gradlew bootJar          # Create JAR
```

**Windows:**
```bash
gradlew.bat clean build
gradlew.bat bootRun
gradlew.bat test
gradlew.bat bootJar
```

## Output Locations

### Maven (Old)
- JAR: `target/workflow-builder-backend-1.0.0.jar`
- Classes: `target/classes/`
- Test classes: `target/test-classes/`

### Gradle (New)
- JAR: `build/libs/workflow-builder-backend-1.0.0.jar`
- Classes: `build/classes/java/main/`
- Test classes: `build/classes/java/test/`

## Dependencies

All dependencies from `pom.xml` have been converted to Gradle format in `build.gradle`. The versions and scopes match exactly.

## Gradle Wrapper

The project includes Gradle wrapper, so you don't need to install Gradle separately. Just use:
- `./gradlew` (Unix/Mac)
- `gradlew.bat` (Windows)

The wrapper will automatically download the correct Gradle version (8.5) if needed.

## IDE Support

### IntelliJ IDEA
- File → Open → Select `build.gradle`
- IntelliJ will automatically import the Gradle project

### Eclipse
- File → Import → Gradle → Existing Gradle Project
- Select the project directory

### VS Code
- Install "Extension Pack for Java"
- Open the project folder
- VS Code will detect Gradle automatically

## Benefits of Gradle

1. **Faster builds** - Gradle's incremental builds are faster
2. **Better dependency resolution** - More efficient dependency management
3. **Groovy/Kotlin DSL** - More flexible build scripts
4. **Better IDE integration** - Modern IDEs have excellent Gradle support
5. **Wrapper included** - No need to install Gradle separately

## Troubleshooting

### Gradle wrapper not executable
```bash
chmod +x gradlew
```

### Build fails with "Gradle wrapper not found"
Run: `gradle wrapper` (if you have Gradle installed) or download the wrapper manually.

### Clean build
```bash
./gradlew clean build
```

### View dependencies
```bash
./gradlew dependencies
```

### View tasks
```bash
./gradlew tasks
```
