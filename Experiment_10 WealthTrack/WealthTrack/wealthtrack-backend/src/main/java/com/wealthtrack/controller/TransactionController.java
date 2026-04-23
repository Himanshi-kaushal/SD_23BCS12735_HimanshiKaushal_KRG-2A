package com.wealthtrack.controller;

import com.wealthtrack.model.Transaction;
import com.wealthtrack.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/transactions")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getTransactions(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            List<Transaction> transactions = transactionService.getTransactionsByUserId(userId);
            return ResponseEntity.ok(transactions);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransaction(@PathVariable String id, Authentication authentication) {
        try {
            Transaction transaction = transactionService.getTransactionById(id);
            if (transaction == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Verify ownership
            String userId = (String) authentication.getPrincipal();
            if (!transaction.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(transaction);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@Valid @RequestBody Transaction transaction, 
                                                       Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            transaction.setUserId(userId);
            
            Transaction createdTransaction = transactionService.createTransaction(transaction);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdTransaction);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(@PathVariable String id, 
                                                       @Valid @RequestBody Transaction transaction,
                                                       Authentication authentication) {
        try {
            // Verify ownership first
            Transaction existingTransaction = transactionService.getTransactionById(id);
            if (existingTransaction == null) {
                return ResponseEntity.notFound().build();
            }
            
            String userId = (String) authentication.getPrincipal();
            if (!existingTransaction.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            transaction.setUserId(userId);
            Transaction updatedTransaction = transactionService.updateTransaction(id, transaction);
            return ResponseEntity.ok(updatedTransaction);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable String id, Authentication authentication) {
        try {
            // Verify ownership first
            Transaction existingTransaction = transactionService.getTransactionById(id);
            if (existingTransaction == null) {
                return ResponseEntity.notFound().build();
            }
            
            String userId = (String) authentication.getPrincipal();
            if (!existingTransaction.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            transactionService.deleteTransaction(id);
            return ResponseEntity.noContent().build();
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}