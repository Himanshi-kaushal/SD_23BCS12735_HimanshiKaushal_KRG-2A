package com.wealthtrack.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.wealthtrack.model.Transaction;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class TransactionService {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "transactions";

    public TransactionService(Firestore firestore) {
        this.firestore = firestore;
    }

    public List<Transaction> getTransactionsByUserId(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("userId", userId)
                .orderBy("date", Query.Direction.DESCENDING)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Transaction> transactions = new ArrayList<>();

        for (QueryDocumentSnapshot document : documents) {
            Transaction transaction = documentToTransaction(document);
            transactions.add(transaction);
        }

        return transactions;
    }

    public Transaction createTransaction(Transaction transaction) throws ExecutionException, InterruptedException {
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setUpdatedAt(LocalDateTime.now());

        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
        transaction.setId(docRef.getId());

        ApiFuture<WriteResult> future = docRef.set(transactionToMap(transaction));
        future.get(); // Wait for completion

        return transaction;
    }

    public Transaction updateTransaction(String transactionId, Transaction transaction) 
            throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(transactionId);
        
        transaction.setId(transactionId);
        transaction.setUpdatedAt(LocalDateTime.now());

        ApiFuture<WriteResult> future = docRef.set(transactionToMap(transaction), SetOptions.merge());
        future.get();

        return transaction;
    }

    public void deleteTransaction(String transactionId) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                .document(transactionId)
                .delete();
        future.get();
    }

    public Transaction getTransactionById(String transactionId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(transactionId);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return documentToTransaction(document);
        }
        return null;
    }

    private Transaction documentToTransaction(DocumentSnapshot document) {
        Transaction transaction = new Transaction();
        transaction.setId(document.getId());
        transaction.setUserId(document.getString("userId"));
        transaction.setAmount(document.getDouble("amount"));
        transaction.setCategory(document.getString("category"));
        transaction.setDescription(document.getString("description"));
        
        String typeStr = document.getString("type");
        transaction.setType(Transaction.TransactionType.valueOf(typeStr.toUpperCase()));
        
        // Convert Firestore Timestamp to LocalDateTime
        com.google.cloud.Timestamp timestamp = (com.google.cloud.Timestamp) document.get("date");
        if (timestamp != null) {
            transaction.setDate(LocalDateTime.ofInstant(timestamp.toDate().toInstant(), ZoneId.systemDefault()));
        }
        
        com.google.cloud.Timestamp createdAt = (com.google.cloud.Timestamp) document.get("createdAt");
        if (createdAt != null) {
            transaction.setCreatedAt(LocalDateTime.ofInstant(createdAt.toDate().toInstant(), ZoneId.systemDefault()));
        }
        
        com.google.cloud.Timestamp updatedAt = (com.google.cloud.Timestamp) document.get("updatedAt");
        if (updatedAt != null) {
            transaction.setUpdatedAt(LocalDateTime.ofInstant(updatedAt.toDate().toInstant(), ZoneId.systemDefault()));
        }

        return transaction;
    }

    private Object transactionToMap(Transaction transaction) {
        return new java.util.HashMap<String, Object>() {{
            put("userId", transaction.getUserId());
            put("amount", transaction.getAmount());
            put("category", transaction.getCategory());
            put("description", transaction.getDescription());
            put("type", transaction.getType().name().toLowerCase());
            put("date", com.google.cloud.Timestamp.of(Date.from(transaction.getDate().atZone(ZoneId.systemDefault()).toInstant())));
            put("createdAt", com.google.cloud.Timestamp.of(Date.from(transaction.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant())));
            put("updatedAt", com.google.cloud.Timestamp.of(Date.from(transaction.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant())));
        }};
    }
}