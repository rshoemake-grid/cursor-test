package com.workflow.security;

import com.workflow.entity.User;
import com.workflow.repository.UserRepository;
import com.workflow.util.ErrorMessages;
import com.workflow.util.RepositoryUtils;
import com.workflow.util.ValidationUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository userRepository;
    
    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String loginId = ValidationUtils.normalizeLoginIdentifier(username);
        if (!StringUtils.hasText(loginId)) {
            throw new UsernameNotFoundException(ErrorMessages.userNotFound(""));
        }
        User user = RepositoryUtils.orElseThrow(
                userRepository.findByUsernameOrEmail(loginId),
                () -> new UsernameNotFoundException(ErrorMessages.userNotFound(loginId)));
        
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getHashedPassword(),
                user.getIsActive(),
                true, true, true,
                new ArrayList<>()
        );
    }
}
