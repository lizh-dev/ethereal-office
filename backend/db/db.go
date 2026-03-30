package db

import (
	"fmt"
	"log"
	"os"

	"github.com/ethereal-office/backend/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=ethereal password=ethereal_dev dbname=ethereal_office port=56322 sslmode=disable"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := DB.AutoMigrate(&model.Floor{}, &model.ChatMessage{}, &model.DMMessage{}); err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}

	fmt.Println("Database connected and migrated")
}
