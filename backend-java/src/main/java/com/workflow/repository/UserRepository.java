package com.workflow.repository;

import com.workflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);

    @Query("SELECT u FROM User u WHERE u.username = :q OR LOWER(u.email) = LOWER(:q)")
    Optional<User> findByUsernameOrEmail(@Param("q") String usernameOrEmail);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);
}
