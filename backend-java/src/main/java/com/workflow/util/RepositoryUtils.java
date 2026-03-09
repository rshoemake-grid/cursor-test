package com.workflow.util;

import com.workflow.exception.ResourceNotFoundException;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;
import java.util.function.Supplier;

/**
 * DRY-5: Centralizes findById-or-throw pattern.
 */
public final class RepositoryUtils {

    private RepositoryUtils() {
    }

    /**
     * Find entity by id or throw ResourceNotFoundException.
     *
     * @param repo    the repository
     * @param id      the id
     * @param message error message if not found
     * @return the entity
     * @throws ResourceNotFoundException if not found
     */
    public static <T, ID> T findByIdOrThrow(CrudRepository<T, ID> repo, ID id, String message) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException(message));
    }

    /**
     * Unwrap Optional or throw ResourceNotFoundException.
     *
     * @param optional the optional
     * @param message  error message if empty
     * @return the value
     * @throws ResourceNotFoundException if empty
     */
    public static <T> T orElseThrow(Optional<T> optional, String message) {
        return optional.orElseThrow(() -> new ResourceNotFoundException(message));
    }

    /**
     * Unwrap Optional or throw custom exception (e.g. UsernameNotFoundException).
     */
    public static <T> T orElseThrow(Optional<T> optional,
                                    Supplier<? extends RuntimeException> exceptionSupplier) {
        return optional.orElseThrow(exceptionSupplier);
    }

    /**
     * Find entity by id or throw custom exception.
     */
    public static <T, ID> T findByIdOrThrow(CrudRepository<T, ID> repo, ID id,
                                            Supplier<? extends RuntimeException> exceptionSupplier) {
        return repo.findById(id).orElseThrow(exceptionSupplier);
    }
}
