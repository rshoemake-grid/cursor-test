package com.workflow.repository;

import com.workflow.entity.PublishedAgent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PublishedAgentRepository extends JpaRepository<PublishedAgent, String> {

    @Query("SELECT p FROM PublishedAgent p " +
           "WHERE (:category IS NULL OR p.category = :category) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<PublishedAgent> findByFilters(@Param("category") String category,
                                        @Param("search") String search,
                                        Pageable pageable);
}
