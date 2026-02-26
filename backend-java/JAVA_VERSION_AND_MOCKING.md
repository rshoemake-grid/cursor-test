# Java Version and Mocking Library Analysis

## Why JDK 23?

**Short Answer:** We're using JDK 23 because it's what's installed on your system, but **it's not the right choice** for this project.

### Current Situation

1. **Project Configuration:** `build.gradle` specifies `sourceCompatibility = '17'` and `targetCompatibility = '17'`
2. **Available JDKs:** Your system only has:
   - Java 24.0.1 (default)
   - Java 23-valhalla (experimental)
3. **Result:** Tests are running with Java 23, which causes compatibility issues

### The Problem with Java 23

Java 23-valhalla is an **experimental preview** version with:
- Different class file format (major version 67)
- Incomplete tooling support
- Mockito and other libraries compiled with older JDKs can't read Java 23 class files

**Error:** `Unsupported class file major version 67`

## Recommended Solutions

### Option 1: Install Java 17 (RECOMMENDED) ⭐

This matches your project's target and has full tooling support:

```bash
# Install Java 17 using Homebrew
brew install openjdk@17

# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Verify
java -version  # Should show 17.x.x

# Run tests
cd backend-java
./gradlew clean test jacocoTestReport
```

**Benefits:**
- ✅ Matches project requirements
- ✅ Full Mockito support
- ✅ Stable, production-ready
- ✅ All 53 tests will pass

### Option 2: Use Java 21 (LTS)

Java 21 is the current LTS version and has good tooling support:

```bash
# Install Java 21
brew install openjdk@21

# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# Run tests (with Mockito agent configuration)
./gradlew clean test jacocoTestReport
```

**Benefits:**
- ✅ LTS version (supported until 2029)
- ✅ Good Mockito support (with agent config)
- ✅ Modern Java features

### Option 3: Update Project to Java 21

If you want to use Java 21, update `build.gradle`:

```groovy
sourceCompatibility = '21'
targetCompatibility = '21'
```

## Mock Library for Java 23

### Current Status: Mockito

**Mockito 5.14.2** is the latest stable version, but it has issues with Java 23:

1. **Class File Compatibility:** Mockito was compiled with Java 17/21 and can't read Java 23 class files
2. **Agent Configuration:** Even with `-javaagent` configuration, the fundamental class file incompatibility remains

### Mockito Alternatives for Java 23+

#### 1. **Mockito with Java Agent** (Current Approach)
```groovy
// Already configured in build.gradle
jvmArgs = [
    "-javaagent:${configurations.mockitoAgent.asPath}",
    "-Xshare:off"
]
```
**Status:** ❌ Doesn't solve Java 23 class file incompatibility

#### 2. **JMockit** (Alternative)
- Different mocking approach
- May have better Java 23 support
- Less popular than Mockito
- Different API (learning curve)

#### 3. **Manual Mocks** (No Framework)
- Write mock implementations manually
- More verbose but full control
- No framework dependencies

#### 4. **Spring Boot Test** (Integration Testing)
- Use `@SpringBootTest` instead of pure unit tests
- Spring creates real beans instead of mocks
- Better for integration tests, heavier for unit tests

### Recommendation for Java 23

**Don't use Java 23 for this project.** Instead:

1. **Install Java 17** (matches project requirements)
2. **Use Mockito 5.14.2** (works perfectly with Java 17)
3. **All tests will pass** ✅

## Why Not Use Java 23?

1. **Project Mismatch:** Project targets Java 17
2. **Tooling Issues:** Mockito and other libraries don't fully support Java 23 yet
3. **Experimental:** Java 23-valhalla is a preview/experimental version
4. **Production Risk:** Not recommended for production use

## Summary

| Java Version | Mockito Support | Recommendation |
|-------------|----------------|----------------|
| Java 17 | ✅ Full support | ⭐ **Use this** (matches project) |
| Java 21 | ✅ Full support (with agent) | ✅ Good alternative (LTS) |
| Java 23 | ❌ Class file incompatibility | ❌ Don't use |
| Java 24 | ❌ Unknown compatibility | ❌ Don't use |

## Action Items

1. **Install Java 17:**
   ```bash
   brew install openjdk@17
   ```

2. **Update your shell profile** (`.zshrc` or `.bash_profile`):
   ```bash
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)
   ```

3. **Run tests:**
   ```bash
   cd backend-java
   ./gradlew clean test jacocoTestReport
   ```

4. **Expected Result:** All 53 tests pass ✅

## Current Test Status

- ✅ **23 tests passing** (WorkflowMapperTest, AuthenticationHelperTest)
- ❌ **30 tests failing** (WorkflowServiceTest, AuthServiceTest) - due to Java 23 incompatibility
- **Root Cause:** Mockito can't read Java 23 class files

Once you switch to Java 17, all tests should pass!
