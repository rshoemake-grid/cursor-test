# Java Version and Mocking Library

## Current Status (Updated 2025)

The Java backend **builds and tests pass** with Java 17, 23, and 24.

### Lombok 1.18.38 for Java 23/24

We use **Lombok 1.18.38** (explicitly pinned in `build.gradle`) for compatibility with Java 23 and 24. Earlier Lombok versions fail with:

```
java.lang.NoSuchFieldException: com.sun.tools.javac.code.TypeTag :: UNKNOWN
```

The `TypeTag.UNKNOWN` field was removed in Java 23+. Lombok 1.18.38+ adds support for these JDK versions.

### Java Version Support

| Java Version | Build | Tests | Notes |
|-------------|-------|-------|-------|
| Java 17 | ✅ | ✅ | Matches project target; full tooling support |
| Java 21 | ✅ | ✅ | LTS; good alternative |
| Java 23 | ✅ | ✅ | Works with Lombok 1.18.38; JaCoCo may show instrumentation warnings |
| Java 24 | ✅ | ✅ | Works with Lombok 1.18.38; JaCoCo may show instrumentation warnings |

### Running Tests

```bash
cd backend-java
./gradlew test
```

With coverage (JaCoCo):

```bash
./gradlew test jacocoTestReport
```

**Note:** On Java 23/24, JaCoCo may log warnings when instrumenting JDK classes (e.g. `CLDRLocaleDataMetaInfo`). These do not fail the build; tests still pass.

### Mockito Configuration

Mockito 5.14.2 is used with the inline mock maker for Java 17+ compatibility (mocking final classes/methods). The test task in `build.gradle` configures:

- `-javaagent` for Mockito
- `--add-opens` for reflection access
- `mockito.mock-maker: mock-maker-inline`

### Recommended Setup

- **Production/CI:** Java 17 (matches `sourceCompatibility`/`targetCompatibility`)
- **Local development:** Java 17, 21, 23, or 24 all work
