# AddressSanitizer + GNAT Guidance

## Task b79b8d: Provide ASan + GNAT Guidance
**Owner**: @test_stabilize
**Date**: 2025-11-26

---

## Executive Summary

AddressSanitizer (ASan) can be used with GNAT-compiled Ada code, but with important limitations. This document provides guidance for integrating ASan into the PolyORB microservices project.

---

## GNAT + ASan Compatibility

### Supported Configurations

| Configuration | Support Level | Notes |
|--------------|---------------|-------|
| GNAT + Clang ASan runtime | ✅ Partial | Requires careful linking |
| Pure Ada code | ⚠️ Limited | ASan primarily detects C-style memory errors |
| Ada + C/C++ mixed | ✅ Good | Best use case for ASan |
| GNAT FSF (GCC-based) | ✅ Native | GCC ASan support built-in |
| GNAT Pro | ✅ Native | Full ASan support |

### Key Limitations

1. **Ada Memory Model**: Ada's strong typing and controlled types prevent many memory errors at compile time
2. **Storage Pools**: Custom storage pools may not be instrumented by ASan
3. **Tasking**: Ada tasking interacts differently with ASan's thread detection
4. **Unchecked_Deallocation**: Primary target for ASan detection in Ada

---

## Build Configuration

### Option 1: GCC-based GNAT with ASan (Recommended)

```bash
# Compile Ada code with ASan
gnatmake -cargs -fsanitize=address -fno-omit-frame-pointer \
         -largs -fsanitize=address \
         your_program.adb

# Or using GPRBuild
gprbuild -P project.gpr \
         -cargs -fsanitize=address -fno-omit-frame-pointer \
         -largs -fsanitize=address
```

### Option 2: GPRBuild Project Configuration

Add to your `.gpr` file:

```ada
project Your_Project is

   type Build_Mode is ("normal", "sanitize");
   Mode : Build_Mode := external ("BUILD_MODE", "normal");

   package Compiler is
      case Mode is
         when "normal" =>
            for Default_Switches ("Ada") use ("-g", "-O2");
         when "sanitize" =>
            for Default_Switches ("Ada") use
              ("-g", "-O1",
               "-fsanitize=address",
               "-fno-omit-frame-pointer");
      end case;
   end Compiler;

   package Linker is
      case Mode is
         when "normal" =>
            for Default_Switches ("Ada") use ();
         when "sanitize" =>
            for Default_Switches ("Ada") use ("-fsanitize=address");
      end case;
   end Linker;

end Your_Project;
```

Build with sanitizers:
```bash
gprbuild -P project.gpr -XBUILD_MODE=sanitize
```

### Option 3: Mixed Ada + C++ Projects

For projects like PolyORB with C bindings:

```bash
# Set environment for both compilers
export CC=clang
export CXX=clang++
export CFLAGS="-fsanitize=address -fno-omit-frame-pointer"
export CXXFLAGS="-fsanitize=address -fno-omit-frame-pointer"
export LDFLAGS="-fsanitize=address"

# Configure and build
./configure --prefix=/usr/local
make
```

---

## Runtime Configuration

### Environment Variables

```bash
# ASan options for Ada programs
export ASAN_OPTIONS="detect_leaks=1:\
check_initialization_order=1:\
detect_stack_use_after_return=1:\
strict_init_order=1:\
print_stats=1:\
suppressions=.sanitizers/asan-ada.supp"

# Leak sanitizer (included with ASan)
export LSAN_OPTIONS="suppressions=.sanitizers/lsan-ada.supp"
```

### Ada-Specific Suppression File

Create `.sanitizers/asan-ada.supp`:

```
# Suppress known GNAT runtime allocations
leak:__gnat_malloc
leak:system__secondary_stack__ss_allocate
leak:system__pool_global__allocate

# Suppress Ada.Containers internal allocations (if not using controlled cleanup)
leak:ada__containers__*

# Suppress tasking runtime
leak:system__tasking__*
```

---

## What ASan Detects in Ada Code

### Detectable Issues

| Issue | Ada Construct | Detection |
|-------|---------------|-----------|
| Use-after-free | `Unchecked_Deallocation` | ✅ Excellent |
| Double-free | Multiple `Unchecked_Deallocation` | ✅ Excellent |
| Buffer overflow | `Unchecked_Conversion`, C bindings | ✅ Good |
| Stack overflow | Deep recursion | ✅ Good |
| Memory leaks | Missing deallocation | ✅ Good |

### Not Detected / Limited

| Issue | Reason |
|-------|--------|
| Array bounds errors | Ada runtime checks catch these first |
| Discriminant errors | Ada type system prevents at compile time |
| Access-before-elaboration | Ada elaboration rules handle this |
| Storage pool errors | Custom pools may not be instrumented |

---

## PolyORB-Specific Guidance

### Priority Areas for ASan

1. **PolyORB.Any_Types** - Uses `Unchecked_Deallocation`
2. **PolyORB.Buffers** - Raw memory management
3. **PolyORB.Representations.CDR** - Marshalling/unmarshalling
4. **C bindings** - Any Ada↔C interface code

### Recommended Test Approach

```bash
# Build PolyORB test suite with ASan
cd polyorb_tests
gprbuild -P polyorb_tests.gpr -XBUILD_MODE=sanitize

# Run with ASan
ASAN_OPTIONS="detect_leaks=1:log_path=asan.log" ./bin/test_runner

# Check for errors
grep -E "ERROR:|WARNING:" asan.log*
```

### Integration with Existing CI

The sanitizers-ci.yml workflow handles C++ services. For Ada code, add:

```yaml
# .github/workflows/ada-sanitizers-ci.yml
name: Ada Sanitizers

on:
  push:
    paths:
      - 'polyorb_tests/**/*.adb'
      - 'polyorb_tests/**/*.ads'

jobs:
  ada-asan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install GNAT
        run: |
          sudo apt-get update
          sudo apt-get install -y gnat-12 gprbuild

      - name: Build with ASan
        run: |
          cd polyorb_tests
          gprbuild -P polyorb_tests.gpr \
            -cargs -fsanitize=address -fno-omit-frame-pointer \
            -largs -fsanitize=address

      - name: Run Tests
        env:
          ASAN_OPTIONS: "detect_leaks=1:halt_on_error=0:log_path=asan"
        run: |
          cd polyorb_tests
          ./bin/test_runner || true

      - name: Check ASan Output
        run: |
          if grep -q "ERROR:" asan.*; then
            echo "ASan detected errors!"
            cat asan.*
            exit 1
          fi
```

---

## Troubleshooting

### Common Issues

**1. Linker errors with ASan**
```
undefined reference to `__asan_*`
```
**Solution**: Ensure `-fsanitize=address` is in both compile AND link flags.

**2. False positives in GNAT runtime**
```
LeakSanitizer: detected memory leaks in __gnat_malloc
```
**Solution**: Add to suppression file or use `LSAN_OPTIONS=detect_leaks=0`.

**3. Conflicts with Ada runtime checks**
```
raised CONSTRAINT_ERROR before ASan could detect
```
**Solution**: This is expected - Ada catches errors earlier. Consider `-gnatp` to disable some checks for ASan testing only.

**4. Performance impact**
ASan typically adds 2-3x slowdown. For performance-critical tests, run sanitizers in a separate CI job.

---

## Recommendations

### For PolyORB Project

1. **Start with C binding code** - Highest value for ASan
2. **Focus on Unchecked_Deallocation** - Main source of memory bugs in Ada
3. **Use suppression files** - Filter GNAT runtime noise
4. **Run in separate CI job** - Don't block main builds on ASan
5. **Combine with Valgrind** - Valgrind catches different issues

### Testing Priority

| Component | ASan Value | Priority |
|-----------|------------|----------|
| PolyORB C bindings | HIGH | P1 |
| Any_Types deallocation | HIGH | P1 |
| Buffer management | MEDIUM | P2 |
| CDR marshalling | MEDIUM | P2 |
| Pure Ada logic | LOW | P3 |

---

## Related Resources

- **Existing CI**: `.github/workflows/sanitizers-ci.yml` (C++ services)
- **Suppression files**: `.sanitizers/asan.supp`, `.sanitizers/lsan.supp`
- **Valgrind CI**: `.github/workflows/valgrind-ci.yml`
- **CMake module**: `cmake/Sanitizers.cmake`

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-26 | 1.0 | Initial guidance document |
